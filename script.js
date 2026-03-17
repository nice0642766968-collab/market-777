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
const storage = firebase.storage();

let isLoginMode = true;
let currentChatId = null;

// --- Authentication ---
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authSubtitle').innerText = isLoginMode ? "เข้าสู่ระบบเพื่อเข้าสู่ตลาดนักศึกษา" : "สร้างบัญชีใหม่เพื่อเริ่มใช้งาน";
    document.getElementById('btnAuth').innerText = isLoginMode ? "เข้าสู่ระบบ" : "สมัครสมาชิก";
}

async function handleAuth() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        if (isLoginMode) await auth.signInWithEmailAndPassword(email, pass);
        else await auth.createUserWithEmailAndPassword(email, pass);
    } catch (e) { alert(e.message); }
}

auth.onAuthStateChanged(user => {
    document.getElementById('authView').style.display = user ? 'none' : 'flex';
    document.getElementById('appView').style.display = user ? 'block' : 'none';
    if (user) loadProducts();
});

function logout() { auth.signOut(); }

// --- Image Preview ---
function previewImg(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const img = document.getElementById('imgPre');
            img.src = reader.result;
            img.style.display = 'block';
            document.getElementById('uploadPlaceholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

// --- Post Logic with Image Upload ---
async function savePost() {
    const file = document.getElementById('pImage').files[0];
    const btn = document.getElementById('btnSave');
    
    if (!file || !document.getElementById('pTitle').value) {
        return alert("กรุณากรอกข้อมูลและอัปโหลดรูปภาพให้ครบถ้วน");
    }

    btn.disabled = true;
    btn.innerText = "กำลังอัปโหลด...";

    try {
        // 1. Upload Image to Storage
        const fileRef = storage.ref(`products/${Date.now()}_${file.name}`);
        const snapshot = await fileRef.put(file);
        const imgUrl = await snapshot.ref.getDownloadURL();

        // 2. Save Data to Firestore
        await db.collection("cru_market").add({
            title: document.getElementById('pTitle').value,
            cat: document.getElementById('pCat').value,
            price: Number(document.getElementById('pPrice').value),
            desc: document.getElementById('pDesc').value,
            img: imgUrl,
            owner: auth.currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        closeModal('postModal');
        alert("ลงประกาศขายเรียบร้อยแล้ว!");
    } catch (e) {
        alert("เกิดข้อผิดพลาด: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "ยืนยันโพสต์";
    }
}

// --- Load & Filter Products ---
function loadProducts(filter = 'ทั้งหมด') {
    db.collection("cru_market").orderBy("createdAt", "desc").onSnapshot(snap => {
        const grid = document.getElementById('productGrid');
        grid.innerHTML = '';
        snap.forEach(doc => {
            const p = doc.data();
            if (filter !== 'ทั้งหมด' && p.cat !== filter) return;
            
            grid.innerHTML += `
                <div class="card">
                    <img src="${p.img}" class="card-img">
                    <small style="color:var(--primary); font-weight:bold;">${p.cat}</small>
                    <h3 style="margin:5px 0;">${p.title}</h3>
                    <p class="price-tag">฿${p.price.toLocaleString()}</p>
                    <button class="btn-primary" onclick="openChat('${doc.id}', '${p.title}')">💬 สนใจสอบถาม</button>
                </div>
            `;
        });
    });
}

function filterCat(cat) {
    document.querySelectorAll('#catMenu li').forEach(li => li.classList.remove('active'));
    event.target.classList.add('active');
    loadProducts(cat);
}

// --- Chat System ---
function openChat(id, title) {
    currentChatId = id;
    document.getElementById('chatBox').style.display = 'flex';
    document.getElementById('chatTitle').innerText = title;
    
    db.collection("cru_market").doc(id).collection("messages").orderBy("time")
    .onSnapshot(snap => {
        const box = document.getElementById('chatMsgs');
        box.innerHTML = '';
        snap.forEach(m => {
            const d = m.data();
            const isMe = d.user === auth.currentUser.email;
            box.innerHTML += `
                <div style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; 
                            background: ${isMe ? 'var(--primary)' : '#eee'}; 
                            color: ${isMe ? 'white' : 'black'};
                            padding: 10px; border-radius: 12px; max-width: 80%; font-size: 14px;">
                    ${d.text}
                </div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

async function sendMsg() {
    const text = document.getElementById('msgInput').value;
    if (!text || !currentChatId) return;
    await db.collection("cru_market").doc(currentChatId).collection("messages").add({
        text, user: auth.currentUser.email, time: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('msgInput').value = '';
}

// Helper Functions
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function closeChat() { document.getElementById('chatBox').style.display = 'none'; }
