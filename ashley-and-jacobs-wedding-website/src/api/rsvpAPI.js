async function getList(event) {
    const response = await fetch(`/api/rsvp?event=${encodeURIComponent(event)}`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch RSVP data (${response.status}): ${await response.text().catch(() => response.statusText)}`);
    }
    return response.json(); // array of { fullName, rsvp, dietary, rowIndex }
}

// Submit RSVP with updated responses; backend returns { success, guest, token }
async function putList(event, rsvpList) {
    const response = await fetch(`/api/rsvp?event=${encodeURIComponent(event)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ rsvpList }),
    });
    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`Server error: ${response.status} - ${errText || response.statusText}`);
    }
    // Server refreshes cookie; also returns the updated guest+token for immediate UI updates.
    return response.json(); // { success, guest, token }
}

// Public API Functions (unchanged names)

export async function fetchWeddingRSVP() {
    return getList('wedding');
}

export async function fetchRehearsalDinnerRSVP() {
    return getList('rehearsal');
}

export async function submitWeddingRSVP(rsvpList) {
    // Expecting [{ rowIndex, fullName, rsvp, dietary }]
    return putList('wedding', rsvpList);
}

export async function submitRehearsalDinnerRSVP(rsvpList) {
    return putList('rehearsal', rsvpList);
}
