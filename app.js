// Firebase configuration - Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaS_D-8VGroIJfCoN3gzXg_jYJpJsq4hOngST",
  authDomain: "apex-4a26a.firebaseapp.com",
  projectId: "apex-4a26a",
  storageBucket: "apex-4a26a.firestorage.app",
  messagingSenderId: "163808101285",
  appId: "1:163808101285:web:b5738d69204e0f141a1e4c"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Add this debugging code here
console.log("Firebase initialized with project:", firebaseConfig.projectId);
console.log("Current auth state at init:", auth.currentUser ? "Logged in" : "Not logged in");

// Test Firestore permissions
db.collection('test').doc('test').set({
  test: 'Testing write permissions',
  timestamp: firebase.firestore.FieldValue.serverTimestamp()
})
.then(() => {
  console.log('Write test successful - you have write permissions!');
})
.catch(error => {
  console.error('Write test failed:', error);
});

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
    // Comment out the redirect
    window.location.href = "login.html";
    console.log("No user signed in");
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
      <td>${order.slNo || ''}</td>
      <td>${order.mouNo || ''}</td>
      <td class="school-name-cell" data-id="${order.id}">${order.schoolName || ''}</td>
      <td>${order.place || ''}</td>
      <td>${order.classes || ''}</td>
      <td>${order.programType || ''}</td>
      <td>${order.orders || ''}</td>
      <td>${order.rate || ''}</td>
      <td>${order.amount ? '₹' + parseInt(order.amount).toLocaleString('en-IN') : ''}</td>
      <td>${order.remarks || ''}</td>
      <td>${order.orderSource || order.distributor || ''}</td>
    `;
    ordersTableBody.appendChild(row);
  });
  
  // Add event listeners to school name cells
  document.querySelectorAll('.school-name-cell').forEach(cell => {
    cell.addEventListener('click', function() {
      const orderId = this.getAttribute('data-id');
      showEditDialog(orderId);
    });
    // Add styling to make it look clickable
    cell.style.cursor = 'pointer';
    cell.style.color = 'var(--primary-color)';
    cell.style.textDecoration = 'underline';
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

function showNewOrderForm() {
  // First, get the current highest slNo
  db.collection("schoolOrders")
    .orderBy("slNo", "desc")
    .limit(1)
    .get()
    .then((querySnapshot) => {
      let nextSlNo = 1; // Default if no orders exist
      
      if (!querySnapshot.empty) {
        const highestOrder = querySnapshot.docs[0].data();
        nextSlNo = parseInt(highestOrder.slNo) + 1;
      }
      
      // Create modal HTML
      const modalHTML = `
      <div class="modal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>New School Order</h2>
          <form id="orderForm">
            <div class="form-group">
              <label for="slNo">SL. No</label>
              <input type="number" id="slNo" value="${nextSlNo}" readonly>
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
                <option value="">Select Class</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
              </select>
            </div>
            <div class="form-group">
              <label for="programType">Program Type</label>
              <select id="programType" required>
                <option value="">Select Program Type</option>
                <option value="Aspirants">Aspirants</option>
                <option value="Scholars">Scholars</option>
                <option value="Olympiad">Olympiad</option>
              </select>
            </div>
            <div class="form-group">
              <label for="orders">Quantity</label>
              <input type="number" id="orders" onchange="calculateAmount()">
            </div>
            <div class="form-group">
              <label for="rate">Rate</label>
              <input type="number" id="rate" onchange="calculateAmount()">
            </div>
            <div class="form-group">
              <label for="amount">Amount</label>
              <input type="number" id="amount" readonly>
            </div>
            <div class="form-group">
              <label for="remarks">Remarks</label>
              <input type="text" id="remarks">
            </div>
            <div class="form-group">
              <label for="orderSource">Order Source</label>
              <select id="orderSource" required>
                <option value="">Select Order Source</option>
                <option value="DIRECT">DIRECT</option>
                <option value="DISTRIBUTOR">DISTRIBUTOR</option>
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
      
      // Add calculate amount function to window
      window.calculateAmount = function() {
        const quantity = document.getElementById('orders').value || 0;
        const rate = document.getElementById('rate').value || 0;
        const amount = quantity * rate;
        document.getElementById('amount').value = amount;
      };
      
      // Form submit handler
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newOrderData = {
          slNo: document.getElementById('slNo').value,
          mouNo: document.getElementById('mouNo').value,
          schoolName: document.getElementById('schoolName').value,
          place: document.getElementById('place').value,
          classes: document.getElementById('classes').value,
          programType: document.getElementById('programType').value,
          orders: document.getElementById('orders').value,
          rate: document.getElementById('rate').value,
          amount: document.getElementById('amount').value,
          remarks: document.getElementById('remarks').value,
          orderSource: document.getElementById('orderSource').value,
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
    })
    .catch((error) => {
      console.warn("Error getting highest slNo, defaulting to 1:", error);
      
      // Create modal with default slNo of 1
      const modalHTML = `
      <div class="modal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>New School Order</h2>
          <form id="orderForm">
            <div class="form-group">
              <label for="slNo">SL. No</label>
              <input type="number" id="slNo" value="1" readonly>
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
                <option value="">Select Class</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
              </select>
            </div>
            <div class="form-group">
              <label for="programType">Program Type</label>
              <select id="programType" required>
                <option value="">Select Program Type</option>
                <option value="Aspirants">Aspirants</option>
                <option value="Scholars">Scholars</option>
                <option value="Olympiad">Olympiad</option>
              </select>
            </div>
            <div class="form-group">
              <label for="orders">Quantity</label>
              <input type="number" id="orders" onchange="calculateAmount()">
            </div>
            <div class="form-group">
              <label for="rate">Rate</label>
              <input type="number" id="rate" onchange="calculateAmount()">
            </div>
            <div class="form-group">
              <label for="amount">Amount</label>
              <input type="number" id="amount" readonly>
            </div>
            <div class="form-group">
              <label for="remarks">Remarks</label>
              <input type="text" id="remarks">
            </div>
            <div class="form-group">
              <label for="orderSource">Order Source</label>
              <select id="orderSource" required>
                <option value="">Select Order Source</option>
                <option value="DIRECT">DIRECT</option>
                <option value="DISTRIBUTOR">DISTRIBUTOR</option>
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
      
      // Add calculate amount function to window
      window.calculateAmount = function() {
        const quantity = document.getElementById('orders').value || 0;
        const rate = document.getElementById('rate').value || 0;
        const amount = quantity * rate;
        document.getElementById('amount').value = amount;
      };
      
      // Form submit handler
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newOrderData = {
          slNo: document.getElementById('slNo').value,
          mouNo: document.getElementById('mouNo').value,
          schoolName: document.getElementById('schoolName').value,
          place: document.getElementById('place').value,
          classes: document.getElementById('classes').value,
          programType: document.getElementById('programType').value,
          orders: document.getElementById('orders').value,
          rate: document.getElementById('rate').value,
          amount: document.getElementById('amount').value,
          remarks: document.getElementById('remarks').value,
          orderSource: document.getElementById('orderSource').value,
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
              <input type="number" id="edit-slNo" value="${orderData.slNo || ''}" readonly>
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
                <option value="">Select Class</option>
                <option value="1" ${orderData.classes === '1' ? 'selected' : ''}>1</option>
                <option value="2" ${orderData.classes === '2' ? 'selected' : ''}>2</option>
                <option value="3" ${orderData.classes === '3' ? 'selected' : ''}>3</option>
                <option value="4" ${orderData.classes === '4' ? 'selected' : ''}>4</option>
                <option value="5" ${orderData.classes === '5' ? 'selected' : ''}>5</option>
                <option value="6" ${orderData.classes === '6' ? 'selected' : ''}>6</option>
                <option value="7" ${orderData.classes === '7' ? 'selected' : ''}>7</option>
                <option value="8" ${orderData.classes === '8' ? 'selected' : ''}>8</option>
                <option value="9" ${orderData.classes === '9' ? 'selected' : ''}>9</option>
                <option value="10" ${orderData.classes === '10' ? 'selected' : ''}>10</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit-programType">Program Type</label>
              <select id="edit-programType" required>
                <option value="">Select Program Type</option>
                <option value="Aspirants" ${orderData.programType === 'Aspirants' ? 'selected' : ''}>Aspirants</option>
                <option value="Scholars" ${orderData.programType === 'Scholars' ? 'selected' : ''}>Scholars</option>
                <option value="Olympiad" ${orderData.programType === 'Olympiad' ? 'selected' : ''}>Olympiad</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit-orders">Quantity</label>
              <input type="number" id="edit-orders" value="${orderData.orders || ''}" onchange="calculateEditAmount()">
            </div>
            <div class="form-group">
              <label for="edit-rate">Rate</label>
              <input type="number" id="edit-rate" value="${orderData.rate || ''}" onchange="calculateEditAmount()">
            </div>
            <div class="form-group">
              <label for="edit-amount">Amount</label>
              <input type="number" id="edit-amount" value="${orderData.amount || ''}" readonly>
            </div>
            <div class="form-group">
              <label for="edit-remarks">Remarks</label>
              <input type="text" id="edit-remarks" value="${orderData.remarks || ''}">
            </div>
            <div class="form-group">
              <label for="edit-orderSource">Order Source</label>
              <select id="edit-orderSource" required>
                <option value="">Select Order Source</option>
                <option value="DIRECT" ${(orderData.orderSource === 'DIRECT' || orderData.distributor === 'DIRECT') ? 'selected' : ''}>DIRECT</option>
                <option value="DISTRIBUTOR" ${orderData.orderSource === 'DISTRIBUTOR' ? 'selected' : ''}>DISTRIBUTOR</option>
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
      
      // Add calculate amount function for edit form
      window.calculateEditAmount = function() {
        const quantity = document.getElementById('edit-orders').value || 0;
        const rate = document.getElementById('edit-rate').value || 0;
        const amount = quantity * rate;
        document.getElementById('edit-amount').value = amount;
      };
      
      // Calculate amount initially
      calculateEditAmount();
      
      // Form submit handler
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const updatedOrderData = {
          slNo: document.getElementById('edit-slNo').value,
          mouNo: document.getElementById('edit-mouNo').value,
          schoolName: document.getElementById('edit-schoolName').value,
          place: document.getElementById('edit-place').value,
          classes: document.getElementById('edit-classes').value,
          programType: document.getElementById('edit-programType').value,
          orders: document.getElementById('edit-orders').value,
          rate: document.getElementById('edit-rate').value,
          amount: document.getElementById('edit-amount').value,
          remarks: document.getElementById('edit-remarks').value,
          orderSource: document.getElementById('edit-orderSource').value,
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