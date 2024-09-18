document.addEventListener('DOMContentLoaded', function() {
    const loopList = document.getElementById('loopList');
    
    if (!loopList) {
        console.error("Element with id 'loopList' not found");
        return;
    }

    function fetchSchedule() {
        Promise.all([
            fetch('/api/schedule').then(res => res.json()),
            fetch('/api/movies').then(res => res.json())
        ])
        .then(([schedule, movies]) => {
            console.log("Schedule:", schedule);
            console.log("Movies:", movies);

            if (!schedule || !schedule.loopList) {
                console.error("Invalid schedule data:", schedule);
                showError('Invalid schedule data received from server.');
                return;
            }
            if (!Array.isArray(movies)) {
                console.error("Invalid movies data:", movies);
                showError('Invalid movies data received from server.');
                return;
            }

            const movieMap = Object.fromEntries(movies.map(movie => [movie.id, movie]));
            
            if (schedule.loopList.length > 0) {
                loopList.innerHTML = schedule.loopList.map(movieId => {
                    const movie = movieMap[movieId];
                    return movie ? `
                        <li draggable="true" data-id="${movie.id}">
                            ${movie.title}
                            <button class="delete-btn" data-id="${movie.id}">X</button>
                        </li>` : '';
                }).join('');
            } else {
                // If the loop list is empty, display all available movies
                loopList.innerHTML = movies.map(movie => `
                    <li draggable="true" data-id="${movie.id}">
                        ${movie.title}
                        <button class="delete-btn" data-id="${movie.id}">X</button>
                    </li>`
                ).join('');
            }

            setupDragAndDrop();
            setupDeleteButtons();
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Failed to fetch schedule and movies. Please try again.');
        });
    }

    function setupDragAndDrop() {
        let draggedItem = null;

        loopList.addEventListener('dragstart', function(e) {
            draggedItem = e.target;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', draggedItem.innerHTML);
            draggedItem.classList.add('dragging');
        });

        loopList.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const target = e.target;
            if (target.nodeName === 'LI' && target !== draggedItem) {
                const boundingRect = target.getBoundingClientRect();
                const offset = boundingRect.y + (boundingRect.height / 2);
                if (e.clientY - offset > 0) {
                    target.style.borderBottom = 'solid 2px #000';
                    target.style.borderTop = '';
                } else {
                    target.style.borderTop = 'solid 2px #000';
                    target.style.borderBottom = '';
                }
            }
        });

        loopList.addEventListener('dragleave', function(e) {
            e.target.style.borderTop = '';
            e.target.style.borderBottom = '';
        });

        loopList.addEventListener('drop', function(e) {
            e.preventDefault();
            const target = e.target;
            if (target.nodeName === 'LI' && target !== draggedItem) {
                if (e.clientY > target.getBoundingClientRect().top + (target.offsetHeight / 2)) {
                    target.parentNode.insertBefore(draggedItem, target.nextSibling);
                } else {
                    target.parentNode.insertBefore(draggedItem, target);
                }
            }
            target.style.borderTop = '';
            target.style.borderBottom = '';
            updateSchedule();
        });

        loopList.addEventListener('dragend', function(e) {
            draggedItem.classList.remove('dragging');
        });
    }

    function setupDeleteButtons() {
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event bubbling
                const movieId = this.dataset.id;
                deleteFromLoopList(movieId);
            });
        });
    }

    function deleteFromLoopList(movieId) {
        fetch('/api/schedule')
            .then(response => response.json())
            .then(schedule => {
                schedule.loopList = schedule.loopList.filter(id => id !== movieId);
                return fetch('/api/schedule', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(schedule),
                });
            })
            .then(() => fetchSchedule())
            .catch(error => {
                console.error('Error:', error);
                showError('Failed to delete movie from loop list. Please try again.');
            });
    }

    function updateSchedule() {
        const newOrder = Array.from(loopList.children).map(li => li.dataset.id);
        
        fetch('/api/schedule')
            .then(response => response.json())
            .then(schedule => {
                schedule.loopList = newOrder;
                return fetch('/api/schedule', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(schedule),
                });
            })
            .then(() => console.log('Schedule updated'))
            .catch(error => {
                console.error('Error:', error);
                showError('Failed to update schedule. Please try again.');
            });
    }

    function addMovie(e) {
        e.preventDefault();
        const formData = new FormData();
        const fileInput = document.getElementById('movieFile');
        formData.append('movieFile', fileInput.files[0]);

        fetch('/api/movies', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            addToLoopList(data.id);
            fileInput.value = ''; // Clear the file input
        })
        .catch((error) => {
            console.error('Error:', error);
            showError('Failed to add movie. Please try again.');
        });
    }

    function addToLoopList(movieId) {
        fetch('/api/schedule')
            .then(response => response.json())
            .then(schedule => {
                if (!schedule.loopList.includes(movieId)) {
                    schedule.loopList.push(movieId);
                    return fetch('/api/schedule', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(schedule),
                    });
                }
            })
            .then(() => fetchSchedule())
            .catch(error => {
                console.error('Error:', error);
                showError('Failed to add movie to loop list. Please try again.');
            });
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        document.body.insertBefore(errorDiv, document.body.firstChild);
        setTimeout(() => errorDiv.remove(), 5000); // Remove after 5 seconds
    }

    document.getElementById('addMovieForm').addEventListener('submit', addMovie);

    fetchSchedule();
});