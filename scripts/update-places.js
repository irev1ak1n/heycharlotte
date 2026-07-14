const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CATEGORY_FILES = ['barbershops.json', 'restaurants.json', 'coffee-shops.json'];
const MAX_AGE_DAYS = 28;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const FIELD_MASK = [
    'formattedAddress',
    'nationalPhoneNumber',
    'rating',
    'userRatingCount',
    'websiteUri',
    'googleMapsUri',
    'businessStatus'
].join(',');

function daysSince(iso) {
    if (!iso) return Infinity;
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return Infinity;
    return (Date.now() - then) / 86400000;
}

async function fetchPlace(placeId) {
    const url = 'https://places.googleapis.com/v1/places/' + encodeURIComponent(placeId);
    const res = await fetch(url, {
        headers: {
            'X-Goog-Api-Key': API_KEY,
            'X-Goog-FieldMask': FIELD_MASK
        }
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error('HTTP ' + res.status + ' — ' + body.slice(0, 200));
    }
    return res.json();
}

function toDynamic(place) {
    return {
        address: place.formattedAddress ?? null,
        phone: place.nationalPhoneNumber ?? null,
        rating: place.rating ?? null,
        userRatingsTotal: place.userRatingCount ?? null,
        website: place.websiteUri ?? null,
        mapsUrl: place.googleMapsUri ?? null,
        businessStatus: place.businessStatus ?? null,
        lastUpdated: new Date().toISOString()
    };
}

async function processFile(file) {
    const full = path.join(DATA_DIR, file);
    if (!fs.existsSync(full)) {
        console.log('skip (missing): ' + file);
        return;
    }

    const list = JSON.parse(fs.readFileSync(full, 'utf8'));
    let changed = false;

    for (const biz of list) {
        if (!biz.placeId) {
            console.log('skip (no placeId): ' + (biz.name || biz.id || '?'));
            continue;
        }

        const age = daysSince(biz.dynamic && biz.dynamic.lastUpdated);
        if (age < MAX_AGE_DAYS) {
            continue;
        }

        try {
            const place = await fetchPlace(biz.placeId);
            biz.dynamic = Object.assign({}, biz.dynamic, toDynamic(place));
            changed = true;
            console.log('updated: ' + (biz.name || biz.placeId));
        } catch (err) {
            console.log('failed (kept old): ' + (biz.name || biz.placeId) + ' — ' + err.message);
        }
    }

    if (changed) {
        fs.writeFileSync(full, JSON.stringify(list, null, 2) + '\n', 'utf8');
        console.log('wrote: ' + file);
    } else {
        console.log('no changes: ' + file);
    }
}

async function main() {
    if (!API_KEY) {
        console.error('GOOGLE_PLACES_API_KEY is not set');
        process.exit(1);
    }
    for (const file of CATEGORY_FILES) {
        await processFile(file);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});