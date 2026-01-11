let currentJobs = [];
let selectedJobId = null;
let isSplitView = false; 

/* --------------------------------------
   NAVIGATION & LOAD DATA
---------------------------------------*/

function showHome() {
    document.getElementById("homeSection").style.display = "block";
    document.getElementById("jobSection").style.display = "none";
    
    // Clear filters
    document.getElementById("searchTitle").value = "";
    document.getElementById("searchLocation").value = "";
    document.getElementById("filterType").value = "";
    
    resetToGridView(); 
}

function loadJobs(type) {
    document.getElementById("homeSection").style.display = "none";
    document.getElementById("jobSection").style.display = "block";

    // --- Update Header Based on Type ---
    const headerEl = document.getElementById("jobSectionHeader");
    const titleEl = document.getElementById("jobHeaderTitle");
    const descEl = document.getElementById("jobHeaderDesc");

    // Remove old bg classes
    headerEl.classList.remove("bg-it", "bg-nonit");

    if (type === "it") {
        headerEl.classList.add("bg-it");
        titleEl.innerText = "IT Careers";
        descEl.innerText = "Shape the future with top-tier tech opportunities.";
    } else {
        headerEl.classList.add("bg-nonit");
        titleEl.innerText = "Non-IT Careers";
        descEl.innerText = "Operational excellence and business leadership roles.";
    }
    // ----------------------------------------

    resetToGridView();

    const file = type === "it" ? "data/it-jobs.json" : "data/non-it-jobs.json";

    // --- FIX: The complete fetch logic is restored here ---
    fetch(file)
        .then(res => {
            if (!res.ok) throw new Error("HTTP error " + res.status);
            return res.json();
        })
        .then(data => {
            currentJobs = data; // Store data globally
            selectedJobId = null;
            // Explicitly display ALL jobs on initial load
            displayJobs(currentJobs);
        })
        .catch(err => {
            console.error("Error loading jobs:", err);
            document.getElementById("jobsContainer").innerHTML = 
                `<div class="alert alert-danger">Error loading data. Ensure you are running on a local server (e.g., Live Server) and the 'data' folder exists.</div>`;
        });
}

/* --------------------------------------
   DISPLAY LOGIC
---------------------------------------*/

function displayJobs(jobs) {
    const container = document.getElementById("jobsContainer");
    container.innerHTML = "";

    if (jobs.length === 0) {
        container.innerHTML = "<div class='col-12 text-center text-muted mt-5'>No jobs found matching your criteria.</div>";
        return;
    }

    // On mobile, if in split view, the list is hidden via CSS
    const cardClass = isSplitView ? "col-12" : "col-md-6";

    jobs.forEach(job => {
        const wrapper = document.createElement("div");
        wrapper.className = cardClass; 

        const activeClass = (job.id === selectedJobId) ? "selected-job-card" : "";

        wrapper.innerHTML = `
            <div class="card job-tile h-100 ${activeClass}" onclick='showJobDetails(${JSON.stringify(job)})'>
                <div class="card-body">
                    <h5 class="card-title text-primary">${job.title}</h5>
                    <p class="card-text mb-1"><strong>Dept:</strong> ${job.department}</p>
                    <p class="card-text text-muted small">
                        📍 ${job.location} | 💼 ${job.type}
                    </p>
                </div>
            </div>
        `;
        container.appendChild(wrapper);
    });
}

/* --------------------------------------
   DETAIL VIEW & RESPONSIVE LAYOUT SWITCH
---------------------------------------*/

function showJobDetails(job) {
    selectedJobId = job.id;
    switchToSplitView();

    const detailsContent = document.getElementById("detailsContent");
    detailsContent.innerHTML = `
        <h3 class="text-primary">${job.title}</h3>
        <p><strong>Department:</strong> ${job.department}</p>
        <p><strong>Location:</strong> ${job.location}</p>
        <p><strong>Type:</strong> <span class="badge bg-secondary">${job.type}</span></p>
        
        <div class="my-3">
            <button class="btn btn-success w-100" onclick="openApplyModal('${job.title}')">
                Apply Now
            </button>
        </div>
        
        <hr>
        <h5>Description</h5>
        <p>${job.description}</p>
    `;

    // Refresh list to highlight selected item (false = don't reset layout)
    runSearch(false);
    
    // Mobile UX: Scroll to top
    window.scrollTo(0, 0);
}

function switchToSplitView() {
    isSplitView = true;
    
    // LIST COLUMN: Hidden on Mobile, 1/3 width on Desktop
    const listCol = document.getElementById("jobListColumn");
    listCol.className = "col-md-4 d-none d-md-block";
    
    // DETAILS COLUMN: Full width on Mobile, 2/3 width on Desktop
    const detailsCol = document.getElementById("jobDetailsColumn");
    detailsCol.className = "col-md-8 col-12";
    detailsCol.classList.remove("d-none");
}

function resetToGridView() {
    isSplitView = false;
    selectedJobId = null;

    // Restore List to Full Width
    const listCol = document.getElementById("jobListColumn");
    listCol.className = "col-12"; 

    // Hide Details
    const detailsCol = document.getElementById("jobDetailsColumn");
    detailsCol.classList.add("d-none");
    detailsCol.classList.remove("d-block");
    
    // Re-render list
    if(currentJobs.length > 0) displayJobs(currentJobs);
}

/* --------------------------------------
   SEARCH & FILTER
---------------------------------------*/

function runSearch(resetLayout = true) {
    const titleInput = document.getElementById("searchTitle");
    const locationInput = document.getElementById("searchLocation");
    const typeInput = document.getElementById("filterType");

    const title = titleInput ? titleInput.value.toLowerCase().trim() : "";
    const location = locationInput ? locationInput.value.toLowerCase().trim() : "";
    const type = typeInput ? typeInput.value : "";

    let filtered = currentJobs.filter(job => {
        const matchTitle = job.title.toLowerCase().includes(title);
        const matchLoc = job.location.toLowerCase().includes(location);
        const matchType = type === "" || job.type === type;
        return matchTitle && matchLoc && matchType;
    });

    if (resetLayout) {
        resetToGridView();
    } else {
        if (selectedJobId) {
            filtered.sort((a, b) => (a.id === selectedJobId ? -1 : b.id === selectedJobId ? 1 : 0));
        }
    }

    displayJobs(filtered);
}

/* --------------------------------------
   AUTOCOMPLETE
---------------------------------------*/
function showSuggestions(field) {
    const inputId = field === 'title' ? 'searchTitle' : 'searchLocation';
    const boxId = field === 'title' ? 'suggestTitle' : 'suggestLocation';
    
    const inputVal = document.getElementById(inputId).value.toLowerCase();
    const box = document.getElementById(boxId);

    if (!inputVal) { box.style.display = "none"; return; }

    // Logic check: ensure currentJobs has data
    if (!currentJobs || currentJobs.length === 0) return;

    const uniqueValues = [...new Set(currentJobs.map(j => field === 'title' ? j.title : j.location))];
    const matches = uniqueValues.filter(v => v.toLowerCase().includes(inputVal));

    if (matches.length === 0) { box.style.display = "none"; return; }

    box.innerHTML = "";
    matches.forEach(val => {
        const div = document.createElement("div");
        div.className = "suggest-item";
        div.innerText = val;
        div.onclick = () => {
            document.getElementById(inputId).value = val;
            box.style.display = "none";
            runSearch();
        };
        box.appendChild(div);
    });
    box.style.display = "block";
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.position-relative')) {
        document.querySelectorAll('.suggest-box').forEach(el => el.style.display = 'none');
    }
});

/* --------------------------------------
   MODAL LOGIC
---------------------------------------*/
let modalInstance = null;

function openApplyModal(title) {
    document.getElementById("modalJobTitle").innerText = title;
    const el = document.getElementById('applyModal');
    modalInstance = new bootstrap.Modal(el);
    modalInstance.show();
}

function submitApplication() {
    const btn = document.querySelector("#applicationForm button");
    const oldText = btn.innerText;
    btn.innerText = "Sending...";
    btn.disabled = true;

    setTimeout(() => {
        alert("Application Submitted Successfully!");
        document.getElementById("applicationForm").reset();
        modalInstance.hide();
        btn.innerText = oldText;
        btn.disabled = false;
    }, 1000);
}
