const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const app = express();
const port = 3000;

app.use(bodyParser.json());

let menu = []; // Store menu items
let orders = []; // Store orders

// Add Menu Item (POST /menu)
app.post('/menu', (req, res) => {
  const { name, price, category } = req.body;

  if (!name || price <= 0 || !category) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  const menuItem = { id: menu.length + 1, name, price, category };
  menu.push(menuItem);
  res.status(201).json(menuItem);
});

// Get Menu (GET /menu)
app.get('/menu', (req, res) => {
  res.json(menu);
});

// Place Order (POST /orders)
app.post('/orders', (req, res) => {
  const { items } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain items' });
  }

  // Check if all items exist in the menu
  const invalidItems = items.filter(item => !menu.some(menuItem => menuItem.id === item.id));
  if (invalidItems.length > 0) {
    return res.status(400).json({ message: 'Some items are not valid' });
  }

  const order = {
    id: orders.length + 1,
    items,
    status: 'Preparing',
    timestamp: new Date(),
  };

  orders.push(order);
  res.status(201).json(order);
});

// Get Order (GET /orders/:id)
app.get('/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id);
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.json(order);
});

// CRON Job to update order status periodically
cron.schedule('*/5 * * * *', () => {
  orders.forEach(order => {
    if (order.status === 'Preparing') {
      order.status = 'Out for Delivery';
    } else if (order.status === 'Out for Delivery') {
      order.status = 'Delivered';
    }
  });
  console.log('Updated order statuses');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
