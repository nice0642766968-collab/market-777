// 1. ฟังก์ชันแสดงตัวอย่างรูปภาพทันทีที่เลือกไฟล์
function previewImg(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const img = document.getElementById('imgPre');
            img.src = reader.result;
            img.style.display = 'block'; // แสดงรูป
            document.getElementById('uploadPlaceholder').style.display = 'none'; // ซ่อนไอคอนกล้อง
        };
        reader.readAsDataURL(file);
    }
}

// 2. ฟังก์ชันหลักในการส่งโพสต์ไป Firebase
async function savePost() {
    const file = document.getElementById('pImage').files[0];
    const title = document.getElementById('pTitle').value;
    const cat = document.getElementById('pCat').value;
    const price = document.getElementById('pPrice').value;
    const desc = document.getElementById('pDesc').value;
    const btn = document.getElementById('btnSave');

    // ตรวจสอบความครบถ้วนของข้อมูล
    if (!file) return alert("กรุณาเพิ่มรูปภาพสินค้าด้วยครับ");
    if (!title || !price) return alert("กรุณากรอกชื่อสินค้าและราคา");

    // เปลี่ยนสถานะปุ่มป้องกันการกดซ้ำ
    btn.disabled = true;
    btn.innerText = "กำลังส่งข้อมูล...";

    try {
        // ขั้นตอน A: อัปโหลดรูปไปที่ Firebase Storage
        const fileName = `products/${Date.now()}_${file.name}`;
        const fileRef = storage.ref(fileName);
        const uploadTask = await fileRef.put(file);
        
        // ขั้นตอน B: รับ URL ของรูปที่อัปโหลดสำเร็จ
        const imgUrl = await uploadTask.ref.getDownloadURL();

        // ขั้นตอน C: บันทึกข้อมูลทั้งหมดลง Firestore
        await db.collection("market_posts").add({
            title: title,
            category: cat,
            price: Number(price),
            description: desc,
            imageUrl: imgUrl,
            sellerEmail: auth.currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // ขั้นตอน D: ล้างค่าและปิดหน้าต่าง
        alert("ประกาศขายสินค้าสำเร็จแล้ว!");
        resetPostForm();
        closeModal('postModal');

    } catch (error) {
        console.error("Error posting:", error);
        alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "ยืนยันการโพสต์";
    }
}

// ฟังก์ชันล้างข้อมูลในฟอร์ม
function resetPostForm() {
    document.getElementById('pTitle').value = '';
    document.getElementById('pPrice').value = '';
    document.getElementById('pDesc').value = '';
    document.getElementById('pImage').value = '';
    document.getElementById('imgPre').style.display = 'none';
    document.getElementById('uploadPlaceholder').style.display = 'block';
}
