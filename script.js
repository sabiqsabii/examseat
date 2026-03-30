document.addEventListener('DOMContentLoaded', () => {

    let students = [];

    const rollInput = document.getElementById('roll-number');
    const subjectInput = document.getElementById('subject');
    const list = document.getElementById('students-list');
    const count = document.getElementById('student-count');
    const grid = document.getElementById('seating-grid');
    const status = document.getElementById('status-msg');

    const rowsInput = document.getElementById('rows');
    const colsInput = document.getElementById('cols');

    document.getElementById('student-form').addEventListener('submit', addStudent);
    document.getElementById('generate-btn').addEventListener('click', generate);
    document.getElementById('reset-btn').addEventListener('click', reset);
    document.getElementById('file-input').addEventListener('change', uploadFile);

    function getGridSize() {
        return {
            rows: parseInt(rowsInput.value) || 1,
            cols: parseInt(colsInput.value) || 1
        };
    }

    function show(msg) {
        status.innerText = msg;

        // small animation
        status.style.transform = "scale(1.1)";
        setTimeout(() => {
            status.style.transform = "scale(1)";
            status.innerText = '';
        }, 3000);
    }

    function addStudent(e) {
        e.preventDefault();

        let roll = rollInput.value.trim();
        let sub = subjectInput.value;

        if (!roll || !sub) return;

        let exists = students.some(s =>
            s.roll.toLowerCase() === roll.toLowerCase() && s.sub === sub
        );

        if (exists) {
            show("Duplicate entry!");
            return;
        }

        students.push({ roll, sub });

        rollInput.value = '';
        subjectInput.value = '';

        updateList();
    }

    function updateList() {
        list.innerHTML = '';
        count.innerText = students.length;

        students.forEach(s => {
            let li = document.createElement('li');
            li.innerText = `${s.roll} - ${s.sub}`;
            list.appendChild(li);
        });
    }

    function generate() {
        let { rows, cols } = getGridSize();
        let total = rows * cols;

        let pool = [...students];
        let seats = new Array(total).fill(null);

        for (let i = 0; i < total; i++) {

            if (pool.length === 0) break;

            let prev = null;

            if (i % cols !== 0 && seats[i - 1]) {
                prev = seats[i - 1].sub;
            }

            let index = pool.findIndex(s => s.sub !== prev);
            if (index === -1) index = 0;

            seats[i] = pool[index];
            pool.splice(index, 1);
        }

        render(seats, cols);
    }

    // ✅ SINGLE render function with animation
    function render(seats, cols) {
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${cols}, minmax(60px, 1fr))`;

        seats.forEach((s, index) => {
            let div = document.createElement('div');
            div.className = 'seat';

            div.style.animationDelay = `${index * 0.05}s`;

            if (!s) {
                div.classList.add('empty');
                div.innerText = "Empty";
            } else {
                div.classList.add(s.sub);
                div.innerText = `${s.roll}\n${s.sub}`;
            }

            grid.appendChild(div);
        });
    }

    function reset() {
        students = [];
        updateList();
        grid.innerHTML = '';
    }

    // ✅ CSV + EXCEL SUPPORT
    function uploadFile(e) {
        let file = e.target.files[0];
        if (!file) return;

        let fileName = file.name.toLowerCase();

        // ===== EXCEL =====
        if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {

            let reader = new FileReader();

            reader.onload = function(e) {
                let data = new Uint8Array(e.target.result);
                let workbook = XLSX.read(data, { type: "array" });

                let sheet = workbook.Sheets[workbook.SheetNames[0]];
                let json = XLSX.utils.sheet_to_json(sheet);

                json.forEach(row => {
                    let roll = row.Roll || row.roll || row.RollNumber;
                    let sub = row.Subject || row.subject;

                    if (roll && sub) {
                        roll = roll.toString().trim();
                        sub = sub.toString().toLowerCase().trim();

                        let exists = students.some(s =>
                            s.roll.toLowerCase() === roll.toLowerCase() && s.sub === sub
                        );

                        if (!exists) {
                            students.push({ roll, sub });
                        }
                    }
                });

                updateList();
                show("Excel file loaded!");
            };

            reader.readAsArrayBuffer(file);
        }

        // ===== CSV =====
        else {
            let reader = new FileReader();

            reader.onload = function(e) {
                let lines = e.target.result.split("\n");

                for (let i = 1; i < lines.length; i++) {
                    let [roll, sub] = lines[i].split(",");

                    if (roll && sub) {
                        roll = roll.trim();
                        sub = sub.trim().toLowerCase();

                        let exists = students.some(s =>
                            s.roll.toLowerCase() === roll.toLowerCase() && s.sub === sub
                        );

                        if (!exists) {
                            students.push({ roll, sub });
                        }
                    }
                }

                updateList();
                show("CSV loaded!");
            };

            reader.readAsText(file);
        }
    }

});
