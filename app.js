// Firebase configuration - MUST MATCH auth.js exactly
const firebaseConfig = {
  apiKey: "AIzaSyD-8VGroIJfCoN3gzXg_jYJpJsq4hOngSI",
  authDomain: "apex-4a26a.firebaseapp.com",
  projectId: "apex-4a26a",
  storageBucket: "apex-4a26a.firebasestorage.app",
  messagingSenderId: "163808101285",
  appId: "1:163808101285:web:b5738d69204e0f141a1e4c",
  measurementId: "G-0EFGN5FSV5"
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
  console.log("Auth state check on main page:", user ? "Logged in" : "Not logged in");
  
  if (user) {
    // User is signed in
    console.log("User is signed in:", user.email);
    userEmailElement.textContent = user.email;
    
    // Load school orders data
    loadOrderData();
  } else {
    // No user is signed in, redirect to login page
    console.log("No user signed in, redirecting to login page");
    window.location.replace("login.html");
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
    // Create a summary of classes for display in the table
    let classesDisplay = '';
    let programTypesDisplay = '';
    let quantityDisplay = '';
    let totalAmount = '';
    
    // Check if order has the new classDetails structure
    if (order.classDetails && Array.isArray(order.classDetails)) {
      // Format class details for display
      const classEntries = order.classDetails.map(entry => entry.class);
      const programEntries = order.classDetails.map(entry => entry.programType);
      const quantityEntries = order.classDetails.map(entry => entry.quantity);
      
      classesDisplay = classEntries.join(', ');
      programTypesDisplay = [...new Set(programEntries)].join(', '); // Show unique programs
      quantityDisplay = quantityEntries.reduce((sum, q) => sum + parseInt(q || 0), 0); // Sum of quantities
      totalAmount = order.totalAmount || '';
    } else {
      // Handle legacy data format
      classesDisplay = order.classes || '';
      programTypesDisplay = order.programType || '';
      quantityDisplay = order.orders || '';
      totalAmount = order.amount || '';
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${order.slNo || ''}</td>
      <td>${order.mouNo || ''}</td>
      <td class="school-name-cell" data-id="${order.id}">${order.schoolName || ''}</td>
      <td>${order.place || ''}</td>
      <td>${classesDisplay}</td>
      <td>${programTypesDisplay}</td>
      <td>${quantityDisplay}</td>
      <td>${order.rate || ''}</td>
      <td>${totalAmount ? '₹' + parseInt(totalAmount).toLocaleString('en-IN') : ''}</td>
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
    if (order.totalAmount) {
      return sum + parseInt(order.totalAmount || 0);
    } else {
      return sum + parseInt(order.amount || 0);
    }
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

// Function to show new order form
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
            
            <!-- Class Details Section -->
            <div class="class-section">
              <h3>Class Details</h3>
              <div id="class-entries">
                <div class="class-entry">
                  <div class="form-row" style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <div class="form-group">
                      <label for="class-0">Class</label>
                      <select id="class-0" class="class-select" required>
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
                      <label for="program-0">Program Type</label>
                      <select id="program-0" class="program-select" required>
                        <option value="">Select Program</option>
                        <option value="Aspirants">Aspirants</option>
                        <option value="Scholars">Scholars</option>
                        <option value="Olympiad">Olympiad</option>
                        <option value="Customized">Customized</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label for="quantity-0">Quantity</label>
                      <input type="number" id="quantity-0" class="quantity-input" min="1" onchange="calculateSubtotal(0)" required>
                    </div>
                    <div class="form-group">
                      <label for="rate-0">Rate</label>
                      <input type="number" id="rate-0" class="rate-input" min="1" onchange="calculateSubtotal(0)" required>
                    </div>
                    <div class="form-group">
                      <label for="subtotal-0">Subtotal</label>
                      <input type="number" id="subtotal-0" class="subtotal-input" readonly>
                    </div>
                    <div class="form-group" style="align-self: flex-end;">
                      <button type="button" onclick="removeClass(0)" class="btn btn-outline remove-btn" style="display: none;">Remove</button>
                    </div>
                  </div>
                </div>
              </div>
              <button type="button" onclick="addClass()" class="btn btn-outline" style="margin-bottom: 15px;">Add Another Class</button>
            </div>
            
            <div class="form-group">
              <label for="total-amount">Total Amount</label>
              <input type="number" id="total-amount" readonly>
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
      
      // Add helper functions to window
      window.classCounter = 1;
      
      // Calculate subtotal for a specific class entry
      window.calculateSubtotal = function(index) {
        const quantity = document.getElementById(`quantity-${index}`).value || 0;
        const rate = document.getElementById(`rate-${index}`).value || 0;
        const subtotal = quantity * rate;
        document.getElementById(`subtotal-${index}`).value = subtotal;
        
        // Recalculate total amount
        calculateTotalAmount();
      };
      
      // Calculate total amount from all subtotals
      window.calculateTotalAmount = function() {
        let total = 0;
        const subtotals = document.querySelectorAll('.subtotal-input');
        subtotals.forEach(input => {
          total += parseInt(input.value || 0);
        });
        document.getElementById('total-amount').value = total;
      };
      
      // Add a new class entry
      window.addClass = function() {
        const classEntries = document.getElementById('class-entries');
        const newIndex = window.classCounter;
        
        const newEntry = document.createElement('div');
        newEntry.className = 'class-entry';
        newEntry.innerHTML = `
          <div class="form-row" style="display: flex; gap: 10px; margin-bottom: 10px;">
            <div class="form-group">
              <label for="class-${newIndex}">Class</label>
              <select id="class-${newIndex}" class="class-select" required>
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
              <label for="program-${newIndex}">Program Type</label>
              <select id="program-${newIndex}" class="program-select" required>
                <option value="">Select Program</option>
                <option value="Aspirants">Aspirants</option>
                <option value="Scholars">Scholars</option>
                <option value="Olympiad">Olympiad</option>
                <option value="Customized">Customized</option>
              </select>
            </div>
            <div class="form-group">
              <label for="quantity-${newIndex}">Quantity</label>
              <input type="number" id="quantity-${newIndex}" class="quantity-input" min="1" onchange="calculateSubtotal(${newIndex})" required>
            </div>
            <div class="form-group">
              <label for="rate-${newIndex}">Rate</label>
              <input type="number" id="rate-${newIndex}" class="rate-input" min="1" onchange="calculateSubtotal(${newIndex})" required>
            </div>
            <div class="form-group">
              <label for="subtotal-${newIndex}">Subtotal</label>
              <input type="number" id="subtotal-${newIndex}" class="subtotal-input" readonly>
            </div>
            <div class="form-group" style="align-self: flex-end;">
              <button type="button" onclick="removeClass(${newIndex})" class="btn btn-outline remove-btn">Remove</button>
            </div>
          </div>
        `;
        
        classEntries.appendChild(newEntry);
        window.classCounter++;
        
        // Show the remove button on the first entry now that we have multiple
        document.querySelector('.remove-btn').style.display = 'block';
      };
      
      // Remove a class entry
      window.removeClass = function(index) {
        const classEntries = document.getElementById('class-entries');
        const entryToRemove = document.getElementById(`class-${index}`).closest('.class-entry');
        
        classEntries.removeChild(entryToRemove);
        calculateTotalAmount();
        
        // If only one entry remains, hide its remove button
        const remainingEntries = document.querySelectorAll('.class-entry');
        if (remainingEntries.length === 1) {
          document.querySelector('.remove-btn').style.display = 'none';
        }
      };
      
      // Form submit handler
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect all class entries
        const classEntries = [];
        const entryElements = document.querySelectorAll('.class-entry');
        
        entryElements.forEach((entry, index) => {
          const classIndex = entry.querySelector('.class-select').id.split('-')[1];
          classEntries.push({
            class: document.getElementById(`class-${classIndex}`).value,
            programType: document.getElementById(`program-${classIndex}`).value,
            quantity: document.getElementById(`quantity-${classIndex}`).value,
            rate: document.getElementById(`rate-${classIndex}`).value,
            subtotal: document.getElementById(`subtotal-${classIndex}`).value
          });
        });
        
        const newOrderData = {
          slNo: document.getElementById('slNo').value,
          mouNo: document.getElementById('mouNo').value,
          schoolName: document.getElementById('schoolName').value,
          place: document.getElementById('place').value,
          classDetails: classEntries,
          totalAmount: document.getElementById('total-amount').value,
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
      // Similar to above but with slNo=1
    });
}

// Function to show edit dialog
async function showEditDialog(orderId) {
  try {
    const docSnapshot = await db.collection("schoolOrders").doc(orderId).get();
    
    if (docSnapshot.exists) {
      const orderData = docSnapshot.data();
      
      // Check if the order has the new class details structure
      const hasClassDetails = orderData.classDetails && Array.isArray(orderData.classDetails);
      
      // Create class entries HTML
      let classEntriesHtml = '';
      
      if (hasClassDetails) {
        // Use the new structure
        orderData.classDetails.forEach((entry, index) => {
          classEntriesHtml += `
            <div class="class-entry">
              <div class="form-row" style="display: flex; gap: 10px; margin-bottom: 10px;">
                <div class="form-group">
                  <label for="edit-class-${index}">Class</label>
                  <select id="edit-class-${index}" class="edit-class-select" required>
                    <option value="">Select Class</option>
                    <option value="1" ${entry.class === '1' ? 'selected' : ''}>1</option>
                    <option value="2" ${entry.class === '2' ? 'selected' : ''}>2</option>
                    <option value="3" ${entry.class === '3' ? 'selected' : ''}>3</option>
                    <option value="4" ${entry.class === '4' ? 'selected' : ''}>4</option>
                    <option value="5" ${entry.class === '5' ? 'selected' : ''}>5</option>
                    <option value="6" ${entry.class === '6' ? 'selected' : ''}>6</option>
                    <option value="7" ${entry.class === '7' ? 'selected' : ''}>7</option>
                    <option value="8" ${entry.class === '8' ? 'selected' : ''}>8</option>
                    <option value="9" ${entry.class === '9' ? 'selected' : ''}>9</option>
                    <option value="10" ${entry.class === '10' ? 'selected' : ''}>10</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="edit-program-${index}">Program Type</label>
                  <select id="edit-program-${index}" class="edit-program-select" required>
                    <option value="">Select Program</option>
                    <option value="Aspirants" ${entry.programType === 'Aspirants' ? 'selected' : ''}>Aspirants</option>
                    <option value="Scholars" ${entry.programType === 'Scholars' ? 'selected' : ''}>Scholars</option>
                    <option value="Olympiad" ${entry.programType === 'Olympiad' ? 'selected' : ''}>Olympiad</option>
                    <option value="Customized" ${entry.programType === 'Customized' ? 'selected' : ''}>Customized</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="edit-quantity-${index}">Quantity</label>
                  <input type="number" id="edit-quantity-${index}" class="edit-quantity-input" min="1" value="${entry.quantity || ''}" onchange="calculateEditSubtotal(${index})" required>
                </div>
                <div class="form-group">
                  <label for="edit-rate-${index}">Rate</label>
                  <input type="number" id="edit-rate-${index}" class="edit-rate-input" min="1" value="${entry.rate || ''}" onchange="calculateEditSubtotal(${index})" required>
                </div>
                <div class="form-group">
                  <label for="edit-subtotal-${index}">Subtotal</label>
                  <input type="number" id="edit-subtotal-${index}" class="edit-subtotal-input" value="${entry.subtotal || ''}" readonly>
                </div>
                <div class="form-group" style="align-self: flex-end;">
                  <button type="button" onclick="removeEditClass(${index})" class="btn btn-outline edit-remove-btn" ${orderData.classDetails.length > 1 ? '' : 'style="display: none;"'}>Remove</button>
                </div>
              </div>
            </div>
          `;
        });
      } else {
        // Convert from old structure to new structure
        classEntriesHtml = `
          <div class="class-entry">
            <div class="form-row" style="display: flex; gap: 10px; margin-bottom: 10px;">
              <div class="form-group">
                <label for="edit-class-0">Class</label>
                <select id="edit-class-0" class="edit-class-select" required>
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
                <label for="edit-program-0">Program Type</label>
                <select id="edit-program-0" class="edit-program-select" required>
                  <option value="">Select Program</option>
                  <option value="Aspirants" ${orderData.programType === 'Aspirants' ? 'selected' : ''}>Aspirants</option>
                  <option value="Scholars" ${orderData.programType === 'Scholars' ? 'selected' : ''}>Scholars</option>
                  <option value="Olympiad" ${orderData.programType === 'Olympiad' ? 'selected' : ''}>Olympiad</option>
                  <option value="Customized" ${orderData.programType === 'Customized' ? 'selected' : ''}>Customized</option>
                </select>
              </div>
              <div class="form-group">
                <label for="edit-quantity-0">Quantity</label>
                <input type="number" id="edit-quantity-0" class="edit-quantity-input" min="1" value="${orderData.orders || ''}" onchange="calculateEditSubtotal(0)" required>
              </div>
              <div class="form-group">
                <label for="edit-rate-0">Rate</label>
                <input type="number" id="edit-rate-0" class="edit-rate-input" min="1" value="${orderData.rate || ''}" onchange="calculateEditSubtotal(0)" required>
              </div>
              <div class="form-group">
                <label for="edit-subtotal-0">Subtotal</label>
                <input type="number" id="edit-subtotal-0" class="edit-subtotal-input" value="${orderData.amount || ''}" readonly>
              </div>
              <div class="form-group" style="align-self: flex-end;">
                <button type="button" onclick="removeEditClass(0)" class="btn btn-outline edit-remove-btn" style="display: none;">Remove</button>
              </div>
            </div>
          </div>
        `;
      }
      
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
            
            <!-- Class Details Section -->
            <div class="class-section">
              <h3>Class Details</h3>
              <div id="edit-class-entries">
                ${classEntriesHtml}
              </div>
              <button type="button" onclick="addEditClass()" class="btn btn-outline" style="margin-bottom: 15px;">Add Another Class</button>
            </div>
            
            <div class="form-group">
              <label for="edit-total-amount">Total Amount</label>
              <input type="number" id="edit-total-amount" value="${orderData.totalAmount || orderData.amount || ''}" readonly>
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
      
      // Add edit-specific helper functions to window
      window.editClassCounter = hasClassDetails ? orderData.classDetails.length : 1;
      
      // Calculate subtotal for a specific class entry in edit mode
      window.calculateEditSubtotal = function(index) {
        const quantity = document.getElementById(`edit-quantity-${index}`).value || 0;
        const rate = document.getElementById(`edit-rate-${index}`).value || 0;
        const subtotal = quantity * rate;
        document.getElementById(`edit-subtotal-${index}`).value = subtotal;
        
        // Recalculate total amount
        calculateEditTotalAmount();
      };
      
      // Calculate total amount from all subtotals in edit mode
      window.calculateEditTotalAmount = function() {
        let total = 0;
        const subtotals = document.querySelectorAll('.edit-subtotal-input');
        subtotals.forEach(input => {
          total += parseInt(input.value || 0);
        });
        document.getElementById('edit-total-amount').value = total;
      };
      
      // Add a new class entry in edit mode
      window.addEditClass = function() {
        const classEntries = document.getElementById('edit-class-entries');
        const newIndex = window.editClassCounter;
        
        const newEntry = document.createElement('div');
        newEntry.className = 'class-entry';
        newEntry.innerHTML = `
          <div class="form-row" style="display: flex; gap: 10px; margin-bottom: 10px;">
            <div class="form-group">
              <label for="edit-class-${newIndex}">Class</label>
              <select id="edit-class-${newIndex}" class="edit-class-select" required>
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
              <label for="edit-program-${newIndex}">Program Type</label>
              <select id="edit-program-${newIndex}" class="edit-program-select" required>
                <option value="">Select Program</option>
                <option value="Aspirants">Aspirants</option>
                <option value="Scholars">Scholars</option>
                <option value="Olympiad">Olympiad</option>
                <option value="Customized">Customized</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit-quantity-${newIndex}">Quantity</label>
              <input type="number" id="edit-quantity-${newIndex}" class="edit-quantity-input" min="1" onchange="calculateEditSubtotal(${newIndex})" required>
            </div>
            <div class="form-group">
              <label for="edit-rate-${newIndex}">Rate</label>
              <input type="number" id="edit-rate-${newIndex}" class="edit-rate-input" min="1" onchange="calculateEditSubtotal(${newIndex})" required>
            </div>
            <div class="form-group">
              <label for="edit-subtotal-${newIndex}">Subtotal</label>
              <input type="number" id="edit-subtotal-${newIndex}" class="edit-subtotal-input" readonly>
            </div>
            <div class="form-group" style="align-self: flex-end;">
              <button type="button" onclick="removeEditClass(${newIndex})" class="btn btn-outline edit-remove-btn">Remove</button>
            </div>
          </div>
        `;
        
        classEntries.appendChild(newEntry);
        window.editClassCounter++;
        
        // Show the remove button on all entries now that we have multiple
        document.querySelectorAll('.edit-remove-btn').forEach(btn => {
          btn.style.display = 'block';
        });
      };
      
      // Remove a class entry in edit mode
      window.removeEditClass = function(index) {
        const classEntries = document.getElementById('edit-class-entries');
        const entryToRemove = document.getElementById(`edit-class-${index}`).closest('.class-entry');
        
        classEntries.removeChild(entryToRemove);
        calculateEditTotalAmount();
        
        // If only one entry remains, hide its remove button
        const remainingEntries = document.querySelectorAll('.class-entry');
        if (remainingEntries.length === 1) {
          document.querySelector('.edit-remove-btn').style.display = 'none';
        }
      };
      
      // Initialize the edit subtotals and total
      document.querySelectorAll('.edit-subtotal-input').forEach((input, index) => {
        if (!input.value) {
          calculateEditSubtotal(index);
        }
      });
      calculateEditTotalAmount();
      
      // Form submit handler
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect all class entries
        const classEntries = [];
        const entryElements = document.querySelectorAll('#edit-class-entries .class-entry');
        
        entryElements.forEach((entry, index) => {
          const classIndex = entry.querySelector('.edit-class-select').id.split('-')[2];
          classEntries.push({
            class: document.getElementById(`edit-class-${classIndex}`).value,
            programType: document.getElementById(`edit-program-${classIndex}`).value,
            quantity: document.getElementById(`edit-quantity-${classIndex}`).value,
            rate: document.getElementById(`edit-rate-${classIndex}`).value,
            subtotal: document.getElementById(`edit-subtotal-${classIndex}`).value
          });
        });
        
        const updatedOrderData = {
          slNo: document.getElementById('edit-slNo').value,
          mouNo: document.getElementById('edit-mouNo').value,
          schoolName: document.getElementById('edit-schoolName').value,
          place: document.getElementById('edit-place').value,
          classDetails: classEntries,
          totalAmount: document.getElementById('edit-total-amount').value,
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