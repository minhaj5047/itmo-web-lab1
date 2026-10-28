const KEY = "lab1-results";

let canvas = document.getElementById("graph");
let ctx = canvas.getContext("2d");
let form = document.getElementById("point-form");
let yInput = document.getElementById("y-input");
let errorBox = document.getElementById("error");
let tbody = document.getElementById("results-body");
let clearBtn = document.getElementById("clear-button");

const STEP = 52;
const cx = canvas.width / 2;
const cy = canvas.height / 2;

let data = load();

function check(x, y, r) {
    if (x >= 0 && y >= 0) {
        return x * x + y * y <= r * r;
    }
    if (x <= 0 && y >= 0) {
        return x >= -r / 2 && y <= r;
    }
    if (x <= 0 && y <= 0) {
        return y >= -x - r;
    }
    return false;
}

function draw(r) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#e6e6e6";
    ctx.beginPath();
    for (let i = -6; i <= 6; i++) {
        ctx.moveTo(cx + i * STEP, 0);
        ctx.lineTo(cx + i * STEP, canvas.height);
        ctx.moveTo(0, cy - i * STEP);
        ctx.lineTo(canvas.width, cy - i * STEP);
    }
    ctx.stroke();

    if (r) {
        let rp = r * STEP;
        ctx.fillStyle = "rgba(51, 153, 255, 0.75)";

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, rp, -Math.PI / 2, 0);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - rp / 2, cy);
        ctx.lineTo(cx - rp / 2, cy - rp);
        ctx.lineTo(cx, cy - rp);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - rp, cy);
        ctx.lineTo(cx, cy + rp);
        ctx.closePath();
        ctx.fill();
    }

    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(canvas.width, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, canvas.height);
    ctx.stroke();

    ctx.font = "13px Arial";
    ctx.fillText("x", canvas.width - 12, cy - 6);
    ctx.fillText("y", cx + 6, 12);

    for (let i = -5; i <= 5; i++) {
        if (i === 0) continue;
        let px = cx + i * STEP;
        let py = cy - i * STEP;
        ctx.beginPath();
        ctx.moveTo(px, cy - 3);
        ctx.lineTo(px, cy + 3);
        ctx.moveTo(cx - 3, py);
        ctx.lineTo(cx + 3, py);
        ctx.stroke();
        ctx.fillText(i, px - 4, cy + 15);
        ctx.fillText(i, cx + 6, py + 4);
    }

    for (let i = 0; i < data.length; i++) {
        let p = data[i];
        if (p.r === r) {
            ctx.fillStyle = p.hit ? "#2e7d32" : "#c62828";
            ctx.beginPath();
            ctx.arc(cx + p.x * STEP, cy - p.y * STEP, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

function picked(name) {
    let box = form.querySelector('input[name="' + name + '"]:checked');
    if (box) return Number(box.value);
    return null;
}

let allBoxes = form.querySelectorAll('input[type="checkbox"]');
for (let i = 0; i < allBoxes.length; i++) {
    allBoxes[i].addEventListener("change", function () {
        if (this.checked) {
            let group = form.querySelectorAll('input[name="' + this.name + '"]');
            for (let j = 0; j < group.length; j++) {
                if (group[j] !== this) group[j].checked = false;
            }
        }
        if (this.name === "r") draw(picked("r"));
    });
}

const XS = [-5, -4, -3, -2, -1, 0, 1, 2, 3];
const RS = [1, 2, 3, 4, 5];

function yValue() {
    return yInput.value.replace(",", ".");
}

function inRange(t) {
    let neg = t.startsWith("-");
    let whole = t.replace("-", "").split(".")[0].replace(/^0+(?=\d)/, "");
    if (whole.length > 1) return false;
    if (neg) return Number(whole) <= 2;
    return Number(whole) <= 4;
}

function ok() {
    let x = picked("x");
    if (x === null) return "Choose X";
    if (XS.indexOf(x) === -1) return "Bad X";

    let t = yValue();
    if (t === "") return "Enter Y";
    if (!/^-?\d+(\.\d+)?$/.test(t)) return "Y must be number";
    if (!inRange(t)) return "Y must be -3 to 5";

    let r = picked("r");
    if (r === null) return "Choose R";
    if (RS.indexOf(r) === -1) return "Bad R";

    return "";
}

yInput.addEventListener("input", function () {
    let s = yInput.value.replace(/[^0-9.,-]/g, "");
    let neg = s.startsWith("-");
    s = s.replace(/-/g, "");
    let dot = s.search(/[.,]/);
    if (dot !== -1) {
        s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/[.,]/g, "");
    }
    yInput.value = (neg ? "-" : "") + s;
    errorBox.textContent = "";
});

form.addEventListener("submit", function (e) {
    e.preventDefault();

    let msg = ok();
    errorBox.textContent = msg;
    if (msg) return;

    let x = picked("x");
    let y = yValue();
    let r = picked("r");

    data.push({
        x: x,
        y: y,
        r: r,
        hit: check(x, Number(y), r),
        time: Date.now()
    });

    save();
    showTable();
    draw(r);
});

function load() {
    try {
        let s = localStorage.getItem(KEY);
        if (s) {
            let savedData = JSON.parse(s);
            for (let i = 0; i < savedData.length; i++) {
                let p = savedData[i];
                p.hit = check(p.x, Number(p.y), p.r); 
            }
            return savedData;
        }
        return [];
    } catch (e) {
        return [];
    }
}

function save() {
    localStorage.setItem(KEY, JSON.stringify(data));
}

function showTable() {
    tbody.innerHTML = "";
    for (let i = data.length - 1; i >= 0; i--) {
        let p = data[i];
        let tr = document.createElement("tr");
        let d = new Date(p.time).toLocaleString("ru-RU");
        let values = [p.x, p.y, p.r, p.hit ? "Hit" : "Miss", d];

        for (let j = 0; j < values.length; j++) {
            let td = document.createElement("td");
            td.textContent = values[j];
            if (j === 3) td.className = p.hit ? "hit" : "miss";
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
}

clearBtn.addEventListener("click", function () {
    data = [];
    localStorage.removeItem(KEY);
    showTable();
    draw(picked("r"));
});

showTable();
draw(picked("r"));
