// Your final, corrected clubhead-dashboard.js file

window.onload = async function() {
    const role = localStorage.getItem('role');
    if (!getToken() || role !== "clubhead") {
        alert("Please login as a Club Head first!");
        window.location.href = "login.html";
        return;
    }

    // THE ONLY CHANGE IS ON THE NEXT LINE: we add a timestamp to prevent caching
    const res = await apiRequest("/clubhead/dashboard?_=" + new Date().getTime());

    if (res.error) {
        document.body.innerHTML = `<h2>Error: ${res.error}</h2>`;
        return;
    }

    // Populate dashboard stats
    document.getElementById("clubName").innerText = res.name;
    document.getElementById("totalMembers").innerText = res.members.length;
    document.getElementById("pendingRequestsCount").innerText = res.pendingRequests.length;

    renderPendingRequests(res.pendingRequests);
    renderMembers(res.members);
};

function renderPendingRequests(requests) {
    const list = document.getElementById("pendingRequestsList");
    if (requests.length === 0) {
        list.innerHTML = "<p class='text-gray-500'>No pending requests</p>";
        return;
    }
    list.innerHTML = requests.map(req => `
        <div class="border p-3 rounded-lg shadow-sm">
            <div class="font-bold">${req.name} (${req.username})</div>
            <div class="text-sm text-gray-600">${req.rollNumber}</div>
            <div class="mt-2 flex gap-2">
                <button 
                    class="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600" 
                    onclick="respondToRequest('${req._id}', 'accept')">
                    Accept
                </button>
                <button 
                    class="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600" 
                    onclick="respondToRequest('${req._id}', 'reject')">
                    Reject
                </button>
            </div>
        </div>
    `).join("");
}

function renderMembers(members) {
    const list = document.getElementById("membersList");
    if (members.length === 0) {
        list.innerHTML = "<p class='text-gray-500'>No members yet</p>";
        return;
    }
    list.innerHTML = members.map(mem => `
        <div class="border p-3 rounded-lg">
            <div class="font-bold">${mem.name} (${mem.username})</div>
            <div class="text-sm text-gray-600">${mem.rollNumber}</div>
        </div>
    `).join("");
}

async function respondToRequest(studentId, action) {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;

    const res = await apiRequest("/clubhead/respond", "POST", { studentId, action });
    if (res.message) {
        alert(res.message);
        window.location.reload(); // Reload to update the lists
    } else {
        alert("Error: " + (res.error || "Failed to respond"));
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = 'login.html';
}

// You can add the event modal functions here later if needed
function openCreateEventModal() { alert('Create Event Coming Soon!'); }
function closeModal() { /* logic to close modal */ }
function createEvent(event) { event.preventDefault(); alert('Event creation coming soon!'); }