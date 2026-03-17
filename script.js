const firebaseConfig = {
    apiKey: "AIzaSyAmbzRxqYFti6IEksy2WunKCVa_v8Gg0F0",
    authDomain: "market-digital-3d10e.firebaseapp.com",
    projectId: "market-digital-3d10e",
    storageBucket: "market-digital-3d10e.firebasestorage.app",
    messagingSenderId: "368580098929",
    appId: "1:368580098929:web:7e005211ceb83b3b9794d0",
    measurementId: "G-Q985QSMDDT"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let isLoginMode = true;
let activeChatId = null;

// --- Authentication Logic ---
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').innerText = isLoginMode ? "เข้าสู่ระบบเพื่อเริ่มใช้งาน" : "สมัครสมาชิกใหม่";
    document.getElementById('btnAuth').innerText = isLoginMode ? "เข้าสู่ระบบ" : "สมัครสมาชิก";
    document.getElementById('btnToggle').innerText = isLoginMode ? "สมัครสมาชิก" : "เข้าสู่ระบบ";
    document.getElementById('toggleText').innerText = isLoginMode ? "ยังไม่มีบัญชี?" : "มีบัญชีอยู่แล้ว?";
}

async function handleAuth() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        if (isLoginMode) await auth.signInWithEmailAndPassword(email, pass);
        else await auth.createUserWithEmailAndPassword(email, pass);
    } catch (e) { alert("Error: " + e.message); }
}

auth.onAuthStateChanged(user => {
    document.getElementById('authSection').style.display = user ? 'none' : 'flex';
    document.getElementById('appSection').style.display = user ? 'block' : 'none';
    if(user) loadProducts();
});

function logout() { auth.signOut(); }

// --- Marketplace Logic ---
function calcPrice() {
    const price = document.getElementById('pPrice').value || 0;
    const split = document.getElementById('pSplit').value || 1;
    document.getElementById('pricePerPerson').innerText = `ราคาต่อคน: ฿${(price / split).toFixed(2)}`;
}

async function savePost() {
    const post = {
        title: document.getElementById('pTitle').value,
        category: document.getElementById('pCat').value,
        price: Number(document.getElementById('pPrice').value),
        split: Number(document.getElementById('pSplit').value),
        desc: document.getElementById('pDesc').value,
        user: auth.currentUser.email,
        time: firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection("products").add(post);
    closeModal('postModal');
}

function loadProducts() {
    db.collection("products").orderBy("time", "desc").onSnapshot(snap => {
        const grid = document.getElementById('productGrid');
        grid.innerHTML = '';
        snap.forEach(doc => {
            const data = doc.data();
            grid.innerHTML += `
                <div class="card">
                    <small style="color: #666;">${data.category}</small>
                    <h3>${data.title}</h3>
                    <div class="price-tag">฿${(data.price / data.split).toFixed(2)} ${data.split > 1 ? '<small style="font-size:12px;">/คน</small>' : ''}</div>
                    <button class="btn-primary" onclick="openChat('${doc.id}', '${data.title}')">💬 สอบถามแชท</button>
                </div>
            `;
        });
    });
}

// --- Chat Logic ---
function openChat(id, title) {
    activeChatId = id;
    document.getElementById('chatBox').style.display = 'flex';
    document.getElementById('chatWith').innerText = title;
    db.collection("products").doc(id).collection("messages").orderBy("time")
    .onSnapshot(snap => {
        const box = document.getElementById('chatMsgs');
        box.innerHTML = '';
        snap.forEach(m => {
            box.innerHTML += `<div><b>${m.data().user.split('@')[0]}:</b> ${m.data().text}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

async function sendMsg() {
    const text = document.getElementById('msgInp').value;
    if(!text) return;
    await db.collection("products").doc(activeChatId).collection("messages").add({
        text, user: auth.currentUser.email, time: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('msgInp').value = '';
}

// Helper Functions
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function closeChat() { document.getElementById('chatBox').style.display = 'none'; }
