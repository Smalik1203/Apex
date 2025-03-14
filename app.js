// Firebase configuration - Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD-8VGroIJfCoN3gzXg_jYJpJsq4hOngSI",
  authDomain: "apex-4a26a.firebaseapp.com",
  projectId: "apex-4a26a",
  storageBucket: "apex-4a26a.firebasestorage.app",
  messagingSenderId: "163808101285",
  appId: "1:163808101285:web:b5738d69204e0f141a1e4c",
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();
  
  // DOM elements
  const ordersTableBody = document.getElementById('orders-table-body');
  const totalAmountElement = document.getElementById('total-amount');
  const searchInput = document.getElementById('search-input');
  const newRecordBtn = document.getElementById('new-record-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userEmailElement = document.getElementById('user-email');
  const modalContainer = document.getElementById('modal-container');
  
  // Check authentication state
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is signed in
      console.log("User is signed in:", user.email);
      userEmailElement.textContent = user.email;
      
      // Load school orders data
      loadOrderData();
    } else {
      // No user is signed in, redirect to login page
      window.location.href = "login.html";
    }
  });
  
  // Load all orders from Firestore
  async function loadOrderData() {
    try {
      const orderSnapshot = await db.collection('schoolOrders')
        .orderBy('slNo', 'asc')
        .get();
      
      const ordersList = orderSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Display the data
      displayOrderData(ordersList);
      
      // Update total amount
      updateTotalAmount(ordersList);
      
      return ordersList;
    } catch (error) {
      console.error("Error getting documents: ", error);
      ordersTableBody.innerHTML = `<tr><td colspan="11">Error loading data: ${error.message}</td></tr>`;
    }
  }
  
  // Display orders in the table
  function displayOrderData(ordersArray) {
    if (ordersArray.length === 0) {
      ordersTableBody.innerHTML = `<tr><td colspan="11" style="text-align: center;">No orders found. Add your first order!</td></tr>`;
      return;
    }
    
    ordersTableBody.innerHTML = '';
    
    ordersArray.forEach(order => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="action-cell" data-id="${order.id}">+</td>
        <td>${order.slNo || ''}</td>
        <td>${order.mouNo || ''}</td>
        <td>${order.schoolName || ''}</td>
        <td>${order.place || ''}</td>
        <td>${order.classes || ''}</td>
        <td>${order.orders || ''}</td>
        <td>${order.rate || ''}</td>
        <td>${order.amount ? '₹' + parseInt(order.amount).toLocaleString('en-IN') : ''}</td>
        <td>${order.remarks || ''}</td>
        <td>${order.distributor || ''}</td>
      `;
      ordersTableBody.appendChild(row);
    });
    
    // Add event listeners to action cells
    document.querySelectorAll('.action-cell').forEach(cell => {
      cell.addEventListener('click', function() {
        const orderId = this.getAttribute('data-id');
        showEditDialog(orderId);
      });
    });
  }
  
  // Calculate and update total amount
  function updateTotalAmount(ordersArray) {
    const total = ordersArray.reduce((sum, order) => {
      return sum + (parseInt(order.amount) || 0);
    }, 0);
    
    totalAmountElement.textContent = '₹' + total.toLocaleString('en-IN');
  }
  
  // Search functionality
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const rows = ordersTableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
      let found = false;
      const cells = row.querySelectorAll('td');
      
      cells.forEach(cell => {
        if (cell.textContent.toLowerCase().includes(searchTerm)) {
          found = true;
        }
      });
      
      row.style.display = found ? '' : 'none';
    });
  });
  
  // Add new record button click handler
  newRecordBtn.addEventListener('click', () => {
    showNewOrderForm();
  });
  
  // Logout functionality
  logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
      // Sign-out successful, redirect to login page
      window.location.href = "login.html";
    }).catch((error) => {
      console.error("Error signing out:", error);
    });
  });
  
  // Function to show new order form modal
  function showNewOrderForm() {
    // Create modal HTML
    const modalHTML = `
    <div class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>New School Order</h2>
        <form id="orderForm">
          <div class="form-group">
            <label for="slNo">SL. No</label>
            <input type="number" id="slNo" required>
          </div>
          <div class="form-group">
            <label for="mouNo">Order No</label>
            <input type="number" id="mouNo" required>
          </div>
          <div class="form-group">
            <label for="schoolName">School Name</label>
            <input type="text" id="schoolName" required>
          </div>
          <div class="form-group">
            <label for="place">Place</label>
            <input type="text" id="place" required>
          </div>
          <div class="form-group">
            <label for="classes">Classes</label>
            <select id="classes" required>
              <option value="">Select Class Type</option>
              <option value="ASPIRANTS">ASPIRANTS</option>
              <option value="JR OLYMPIAD">JR OLYMPIAD</option>
              <option value="ASPIRANTS+JR OLYMPIAD">ASPIRANTS+JR OLYMPIAD</option>
              <option value="SCHOLARS+JR OLYMPIAD">SCHOLARS+JR OLYMPIAD</option>
              <option value="CUSTOMIZED+JR OLYMPIAD">CUSTOMIZED+JR OLYMPIAD</option>
            </select>
          </div>
          <div class="form-group">
            <label for="orders">Orders</label>
            <input type="number" id="orders">
          </div>
          <div class="form-group">
            <label for="rate">Rate</label>
            <select id="rate" required>
              <option value="">Select Rate Type</option>
              <option value="MPCB">MPCB</option>
              <option value="M+S">M+S</option>
              <option value="MPCB & M+S">MPCB & M+S</option>
              <option value="MPCB & M+S+R">MPCB & M+S+R</option>
              <option value="CUSTOMIZED">CUSTOMIZED</option>
            </select>
          </div>
          <div class="form-group">
            <label for="amount">Amount</label>
            <input type="number" id="amount">
          </div>
          <div class="form-group">
            <label for="remarks">Remarks</label>
            <input type="text" id="remarks">
          </div>
          <div class="form-group">
            <label for="distributor">Distributor</label>
            <select id="distributor" required>
              <option value="">Select Distributor</option>
              <option value="DIRECT">DIRECT</option>
              <option value="SHARMA">SHARMA</option>
              <option value="HEMA CHANDRA">HEMA CHANDRA</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Save Order</button>
        </form>
      </div>
    </div>
    `;
    
    // Add modal to page
    modalContainer.innerHTML = modalHTML;
    
    // Get modal elements
    const modal = modalContainer.querySelector('.modal');
    const closeBtn = modalContainer.querySelector('.close');
    const form = modalContainer.querySelector('#orderForm');
    
    // Close button handler
    closeBtn.addEventListener('click', () => {
      modalContainer.innerHTML = '';
    });
    
    // Form submit handler
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const newOrderData = {
        slNo: document.getElementById('slNo').value,
        mouNo: document.getElementById('mouNo').value,
        schoolName: document.getElementById('schoolName').value,
        place: document.getElementById('place').value,
        classes: document.getElementById('classes').value,
        orders: document.getElementById('orders').value,
        rate: document.getElementById('rate').value,
        amount: document.getElementById('amount').value,
        remarks: document.getElementById('remarks').value,
        distributor: document.getElementById('distributor').value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      try {
        await db.collection("schoolOrders").add(newOrderData);
        console.log("Document successfully added!");
        modalContainer.innerHTML = '';
        loadOrderData(); // Reload the data
      } catch (error) {
        console.error("Error adding document: ", error);
        alert("Error adding order: " + error.message);
      }
    });
  }
  
  // Function to show edit dialog
  async function showEditDialog(orderId) {
    try {
      const docSnapshot = await db.collection("schoolOrders").doc(orderId).get();
      
      if (docSnapshot.exists) {
        const orderData = docSnapshot.data();
        
        // Create modal HTML for editing
        const modalHTML = `
        <div class="modal">
          <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Edit School Order</h2>
            <form id="editOrderForm">
              <div class="form-group">
                <label for="edit-slNo">SL. No</label>
                <input type="number" id="edit-slNo" value="${orderData.slNo || ''}" required>
              </div>
              <div class="form-group">
                <label for="edit-mouNo">Order No</label>
                <input type="number" id="edit-mouNo" value="${orderData.mouNo || ''}" required>
              </div>
              <div class="form-group">
                <label for="edit-schoolName">School Name</label>
                <input type="text" id="edit-schoolName" value="${orderData.schoolName || ''}" required>
              </div>
              <div class="form-group">
                <label for="edit-place">Place</label>
                <input type="text" id="edit-place" value="${orderData.place || ''}" required>
              </div>
              <div class="form-group">
                <label for="edit-classes">Classes</label>
                <select id="edit-classes" required>
                  <option value="ASPIRANTS" ${orderData.classes === 'ASPIRANTS' ? 'selected' : ''}>ASPIRANTS</option>
                  <option value="JR OLYMPIAD" ${orderData.classes === 'JR OLYMPIAD' ? 'selected' : ''}>JR OLYMPIAD</option>
                  <option value="ASPIRANTS+JR OLYMPIAD" ${orderData.classes === 'ASPIRANTS+JR OLYMPIAD' ? 'selected' : ''}>ASPIRANTS+JR OLYMPIAD</option>
                  <option value="SCHOLARS+JR OLYMPIAD" ${orderData.classes === 'SCHOLARS+JR OLYMPIAD' ? 'selected' : ''}>SCHOLARS+JR OLYMPIAD</option>
                  <option value="CUSTOMIZED+JR OLYMPIAD" ${orderData.classes === 'CUSTOMIZED+JR OLYMPIAD' ? 'selected' : ''}>CUSTOMIZED+JR OLYMPIAD</option>
                </select>
              </div>
              <div class="form-group">
                <label for="edit-orders">Orders</label>
                <input type="number" id="edit-orders" value="${orderData.orders || ''}">
              </div>
              <div class="form-group">
                <label for="edit-rate">Rate</label>
                <select id="edit-rate" required>
                  <option value="MPCB" ${orderData.rate === 'MPCB' ? 'selected' : ''}>MPCB</option>
                  <option value="M+S" ${orderData.rate === 'M+S' ? 'selected' : ''}>M+S</option>
                  <option value="MPCB & M+S" ${orderData.rate === 'MPCB & M+S' ? 'selected' : ''}>MPCB & M+S</option>
                  <option value="MPCB & M+S+R" ${orderData.rate === 'MPCB & M+S+R' ? 'selected' : ''}>MPCB & M+S+R</option>
                  <option value="CUSTOMIZED" ${orderData.rate === 'CUSTOMIZED' ? 'selected' : ''}>CUSTOMIZED</option>
                </select>
              </div>
              <div class="form-group">
                <label for="edit-amount">Amount</label>
                <input type="number" id="edit-amount" value="${orderData.amount || ''}">
              </div>
              <div class="form-group">
                <label for="edit-remarks">Remarks</label>
                <input type="text" id="edit-remarks" value="${orderData.remarks || ''}">
              </div>
              <div class="form-group">
                <label for="edit-distributor">Distributor</label>
                <select id="edit-distributor" required>
                  <option value="DIRECT" ${orderData.distributor === 'DIRECT' ? 'selected' : ''}>DIRECT</option>
                  <option value="SHARMA" ${orderData.distributor === 'SHARMA' ? 'selected' : ''}>SHARMA</option>
                  <option value="HEMA CHANDRA" ${orderData.distributor === 'HEMA CHANDRA' ? 'selected' : ''}>HEMA CHANDRA</option>
                </select>
              </div>
              <div style="display: flex; gap: 10px; justify-content: space-between;">
                <button type="submit" class="btn btn-primary">Update Order</button>
                <button type="button" id="delete-btn" class="btn btn-outline" style="background-color: #fff0f0; color: #e74c3c; border-color: #e74c3c;">Delete Order</button>
              </div>
            </form>
          </div>
        </div>
        `;
        
        // Add modal to page
        modalContainer.innerHTML = modalHTML;
        
        // Get modal elements
        const modal = modalContainer.querySelector('.modal');
        const closeBtn = modalContainer.querySelector('.close');
        const form = modalContainer.querySelector('#editOrderForm');
        const deleteBtn = modalContainer.querySelector('#delete-btn');
        
        // Close button handler
        closeBtn.addEventListener('click', () => {
          modalContainer.innerHTML = '';
        });
        
        // Form submit handler
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const updatedOrderData = {
            slNo: document.getElementById('edit-slNo').value,
            mouNo: document.getElementById('edit-mouNo').value,
            schoolName: document.getElementById('edit-schoolName').value,
            place: document.getElementById('edit-place').value,
            classes: document.getElementById('edit-classes').value,
            orders: document.getElementById('edit-orders').value,
            rate: document.getElementById('edit-rate').value,
            amount: document.getElementById('edit-amount').value,
            remarks: document.getElementById('edit-remarks').value,
            distributor: document.getElementById('edit-distributor').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          
          try {
            await db.collection("schoolOrders").doc(orderId).update(updatedOrderData);
            console.log("Document successfully updated!");
            modalContainer.innerHTML = '';
            loadOrderData(); // Reload the data
          } catch (error) {
            console.error("Error updating document: ", error);
            alert("Error updating order: " + error.message);
          }
        });
        
        // Delete button handler
        deleteBtn.addEventListener('click', async () => {
          if (confirm('Are you sure you want to delete this order?')) {
            try {
              await db.collection("schoolOrders").doc(orderId).delete();
              console.log("Document successfully deleted!");
              modalContainer.innerHTML = '';
              loadOrderData(); // Reload the data
            } catch (error) {
              console.error("Error removing document: ", error);
              alert("Error deleting order: " + error.message);
            }
          }
        });
      } else {
        console.log("No such document!");
        alert("Order not found!");
      }
    } catch (error) {
      console.error("Error getting document:", error);
      alert("Error loading order: " + error.message);
    }
  }