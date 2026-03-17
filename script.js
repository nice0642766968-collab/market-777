// เพิ่มการเรียกใช้ Storage
const storage = firebase.storage();

// ฟังก์ชันดูตัวอย่างรูปภาพก่อนอัปโหลด
function previewImg(event) {
    const reader = new FileReader();
    reader.onload = function() {
        const output = document.getElementById('imgPre');
        output.src = reader.result;
        output.style.display = 'block';
    };
    reader.readAsDataURL(event.target.files[0]);
}

// ฟังก์ชันบันทึกโพสต์ (ปรับปรุงใหม่)
async function savePost() {
    const file = document.getElementById('pImage').files[0];
    const btn = document.getElementById('btnSave');
    
    if (!file) return alert("กรุณาเลือกรูปภาพสินค้า");
    
    btn.disabled = true;
    btn.innerText = "กำลังอัปโหลด...";

    try {
        // 1. อัปโหลดรูปไปที่ Firebase Storage
        const storageRef = storage.ref(`products/${Date.now()}_${file.name}`);
        const snapshot = await storageRef.put(file);
        const imgUrl = await snapshot.ref.getDownloadURL();

        // 2. บันทึกข้อมูลลง Firestore พร้อม URL รูปภาพ
        const post = {
            title: document.getElementById('pTitle').value,
            cat: document.getElementById('pCat').value,
            price: Number(document.getElementById('pPrice').value),
            desc: document.getElementById('pDesc').value,
            img: imgUrl, // เก็บ URL รูปที่ได้จาก Storage
            owner: auth.currentUser.email,
            time: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection("market_posts").add(post);
        
        // ล้างค่าและปิด Modal
        document.getElementById('pImage').value = '';
        document.getElementById('imgPre').style.display = 'none';
        closeModal('postModal');
        btn.disabled = false;
        btn.innerText = "ยืนยันโพสต์";

    } catch (e) {
        alert("เกิดข้อผิดพลาด: " + e.message);
        btn.disabled = false;
        btn.innerText = "ยืนยันโพสต์";
    }
}

// ปรับปรุงฟังก์ชัน Load Products ให้แสดงรูป
function loadProducts(filter = 'ทั้งหมด') {
    db.collection("market_posts").orderBy("time", "desc").onSnapshot(snap => {
        const grid = document.getElementById('productGrid');
        grid.innerHTML = '';
        snap.forEach(doc => {
            const data = doc.data();
            if (filter !== 'ทั้งหมด' && data.cat !== filter) return;
            
            grid.innerHTML += `
                <div class="card">
                    <img src="${data.img || 'https://via.placeholder.com/300'}" class="card-img">
                    <small style="color:#666">${data.cat}</small>
                    <h3>${data.title}</h3>
                    <p class="price-tag">฿${data.price.toLocaleString()}</p>
                    <button class="btn-primary" onclick="openChat('${doc.id}', '${data.title}')">💬 สอบถามแชท</button>
                </div>
            `;
        });
    });
}
