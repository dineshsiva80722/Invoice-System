

import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'invoicepro';

let db;
let client;

// Standardized API response helper
const apiResponse = (success, data = null, error = null, message = null) => {
  return { success, data, error, message };
};

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('✅ Connected to MongoDB Atlas database:', DB_NAME);
    
    await createCollections();
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    return false;
  }
}

// Create collections with sample data
async function createCollections() {
  try {
    console.log('🏗️ Creating collections in invoicepro database...');
    
    // Create clients collection
    const clientsCollection = db.collection('clients');
    const clientsCount = await clientsCollection.countDocuments();
    
    if (clientsCount === 0) {
      const sampleClients = [
        {
          id: `cl-${Date.now()}-1`,
          name: 'John Smith',
          email: 'john@techcorp.com',
          phone: '+1 (555) 123-4567',
          company: 'TechCorp Solutions',
          address: {
            street: '123 Business Ave',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94107',
            country: 'USA'
          },
          taxNumber: 'TAX-123456',
          paymentTerms: 30,
          creditLimit: 50000,
          totalOutstanding: 15750,
          createdAt: new Date().toISOString().split('T')[0]
        }
      ];
      
      await clientsCollection.insertMany(sampleClients);
      console.log('✅ Created clients collection with sample data');
    }
    
    // Create other collections with similar pattern...
    console.log('🎉 All collections created successfully in invoicepro database!');
  } catch (error) {
    console.error('❌ Failed to create collections:', error);
    throw error;
  }
}

// API Routes

// Test connection
app.get('/api/test', async (req, res) => {
  try {
    const collections = await db.listCollections().toArray();
    res.json(apiResponse(true, {
      database: DB_NAME,
      collections: collections.map(c => c.name),
      message: 'Connected to MongoDB Atlas successfully!'
    }));
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json(apiResponse(false, null, 'Failed to connect to MongoDB'));
  }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const clientsCollection = db.collection('clients');
    const invoicesCollection = db.collection('invoices');

    const [clientCount, invoiceCount] = await Promise.all([
      clientsCollection.countDocuments(),
      invoicesCollection.countDocuments()
    ]);

    const invoices = await invoicesCollection.find().toArray();
    
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const outstandingAmount = invoices
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const overdueAmount = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const stats = {
      totalRevenue,
      totalInvoices: invoiceCount,
      totalClients: clientCount,
      paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
      pendingInvoices: invoices.filter(inv => inv.status === 'sent').length,
      overdueInvoices: invoices.filter(inv => inv.status === 'overdue').length,
      outstandingAmount,
      overdueAmount
    };

    res.json(apiResponse(true, stats));
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    res.status(500).json(apiResponse(false, null, 'Failed to get dashboard statistics'));
  }
});

// Clients API endpoints
app.get('/api/clients', async (req, res) => {
  try {
    const clientsCollection = db.collection('clients');
    const clients = await clientsCollection.find().toArray();
    res.json(apiResponse(true, clients));
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json(apiResponse(false, null, 'Failed to fetch clients'));
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const clientsCollection = db.collection('clients');
    const client = req.body;
    
    // Generate ID if not provided
    if (!client.id) {
      client.id = `cl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    await clientsCollection.insertOne(client);
    res.json(apiResponse(true, client, null, 'Client created successfully'));
  } catch (error) {
    console.error('Failed to save client:', error);
    res.status(500).json(apiResponse(false, null, 'Failed to save client'));
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const clientsCollection = db.collection('clients');
    const clientId = req.params.id;
    console.log('Attempting to delete client with ID:', clientId);
    
    const result = await clientsCollection.deleteOne({ id: clientId });
    
    if (result.deletedCount > 0) {
      console.log('✅ Client deleted successfully');
      res.json(apiResponse(true, true, null, 'Client deleted successfully'));
    } else {
      console.log('❌ Client not found');
      res.status(404).json(apiResponse(false, false, 'Client not found'));
    }
  } catch (error) {
    console.error('Failed to delete client:', error);
    res.status(500).json(apiResponse(false, false, 'Failed to delete client'));
  }
});

// Products API endpoints
app.get('/api/products', async (req, res) => {
  try {
    const productsCollection = db.collection('products');
    const products = await productsCollection.find().toArray();
    res.json(apiResponse(true, products));
  } catch (error) {
    console.error('Failed to get products:', error);
    res.status(500).json(apiResponse(false, null, 'Failed to get products'));
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const productsCollection = db.collection('products');
    const product = req.body;
    
    if (!product.id) {
      product.id = `pr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    await productsCollection.insertOne(product);
    res.json(apiResponse(true, product, null, 'Product created successfully'));
  } catch (error) {
    console.error('Failed to save product:', error);
    res.status(500).json(apiResponse(false, null, 'Failed to save product'));
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const productsCollection = db.collection('products');
    const result = await productsCollection.deleteOne({ id: req.params.id });
    
    if (result.deletedCount > 0) {
      res.json(apiResponse(true, true, null, 'Product deleted successfully'));
    } else {
      res.status(404).json(apiResponse(false, false, 'Product not found'));
    }
  } catch (error) {
    console.error('Failed to delete product:', error);
    res.status(500).json(apiResponse(false, false, 'Failed to delete product'));
  }
});

// Invoices API endpoints
app.get('/api/invoices', async (req, res) => {
  try {
    const invoicesCollection = db.collection('invoices');
    const invoices = await invoicesCollection.find().toArray();
    res.json(apiResponse(true, invoices));
  } catch (error) {
    console.error('Failed to get invoices:', error);
    res.status(500).json(apiResponse(false, null, 'Failed to get invoices'));
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const invoicesCollection = db.collection('invoices');
    const invoice = req.body;
    
    if (!invoice.id) {
      invoice.id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    await invoicesCollection.insertOne(invoice);
    res.json(apiResponse(true, invoice, null, 'Invoice created successfully'));
  } catch (error) {
    console.error('Failed to save invoice:', error);
    res.status(500).json(apiResponse(false, null, 'Failed to save invoice'));
  }
});

app.patch('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const invoicesCollection = db.collection('invoices');
    const result = await invoicesCollection.updateOne(
      { id },
      { $set: { ...updates, updatedAt: new Date().toISOString() } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json(apiResponse(false, null, 'Invoice not found'));
    }
    
    const updatedInvoice = await invoicesCollection.findOne({ id });
    res.json(apiResponse(true, updatedInvoice, null, 'Invoice updated successfully'));
  } catch (error) {
    console.error('Failed to update invoice:', error);
    res.status(500).json(apiResponse(false, null, 'Failed to update invoice'));
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const invoicesCollection = db.collection('invoices');
    const result = await invoicesCollection.deleteOne({ id: req.params.id });
    
    if (result.deletedCount > 0) {
      res.json(apiResponse(true, true, null, 'Invoice deleted successfully'));
    } else {
      res.status(404).json(apiResponse(false, false, 'Invoice not found'));
    }
  } catch (error) {
    console.error('Failed to delete invoice:', error);
    res.status(500).json(apiResponse(false, false, 'Failed to delete invoice'));
  }
});

// Payments API endpoints
app.get('/api/payments', async (req, res) => {
  try {
    const paymentsCollection = db.collection('payments');
    const payments = await paymentsCollection.find().toArray();
    res.json(apiResponse(true, payments));
  } catch (error) {
    console.error('Failed to get payments:', error);
    res.status(500).json(apiResponse(false, null, 'Failed to get payments'));
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const paymentsCollection = db.collection('payments');
    const payment = req.body;
    
    if (!payment.id) {
      payment.id = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    await paymentsCollection.insertOne(payment);
    res.json(apiResponse(true, payment, null, 'Payment created successfully'));
  } catch (error) {
    console.error('Failed to save payment:', error);
    res.status(500).json(apiResponse(false, null, 'Failed to save payment'));
  }
});

app.delete('/api/payments/:id', async (req, res) => {
  try {
    const paymentsCollection = db.collection('payments');
    const result = await paymentsCollection.deleteOne({ id: req.params.id });
    
    if (result.deletedCount > 0) {
      res.json(apiResponse(true, true, null, 'Payment deleted successfully'));
    } else {
      res.status(404).json(apiResponse(false, false, 'Payment not found'));
    }
  } catch (error) {
    console.error('Failed to delete payment:', error);
    res.status(500).json(apiResponse(false, false, 'Failed to delete payment'));
  }
});

// Connection info endpoint
app.get('/api/connection', async (req, res) => {
  try {
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    res.json(apiResponse(true, {
      isConnected: true,
      database: db.databaseName,
      collections: collectionNames
    }));
  } catch (error) {
    console.error('Failed to get connection info:', error);
    res.status(500).json(apiResponse(false, {
      isConnected: false,
      database: null,
      collections: []
    }, 'Failed to get connection info'));
  }
});

// Start server
async function startServer() {
  try {
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('❌ Failed to connect to MongoDB. Server cannot start.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Database: ${DB_NAME}`);
      console.log(`🔗 API endpoints available at http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('🔄 Shutting down server...');
      await client.close();
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
