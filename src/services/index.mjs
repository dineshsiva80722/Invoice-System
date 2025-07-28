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

// MongoDB configuration from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dezprox25:catlover6208@cluster0.jbcrgrb.mongodb.net/invoicepro?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = process.env.DB_NAME || 'invoicepro';
let db;
let client;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('✅ Connected to MongoDB Atlas database:', DB_NAME);
    
    // Create collections if they don't exist
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
        },
        {
          id: `cl-${Date.now()}-2`,
          name: 'Sarah Johnson',
          email: 'sarah@designstudio.com',
          phone: '+1 (555) 234-5678',
          company: 'Creative Design Studio',
          address: {
            street: '456 Creative St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          },
          paymentTerms: 15,
          creditLimit: 25000,
          totalOutstanding: 8400,
          createdAt: new Date().toISOString().split('T')[0]
        }
      ];
      
      await clientsCollection.insertMany(sampleClients);
      console.log('✅ Created clients collection with sample data');
    }
    
    // Create products collection
    const productsCollection = db.collection('products');
    const productsCount = await productsCollection.countDocuments();
    
    if (productsCount === 0) {
      const sampleProducts = [
        {
          id: `pr-${Date.now()}-1`,
          name: 'Web Development',
          description: 'Custom website development and design services',
          rate: 150,
          unit: 'hour',
          category: 'Development',
          isService: true,
          taxRate: 8.5
        },
        {
          id: `pr-${Date.now()}-2`,
          name: 'Business Consulting',
          description: 'Strategic business and technical consulting',
          rate: 200,
          unit: 'hour',
          category: 'Consulting',
          isService: true,
          taxRate: 8.5
        }
      ];
      
      await productsCollection.insertMany(sampleProducts);
      console.log('✅ Created products collection with sample data');
    }
    
    // Create invoices collection
    const invoicesCollection = db.collection('invoices');
    const invoicesCount = await invoicesCollection.countDocuments();
    
    if (invoicesCount === 0) {
      const sampleInvoices = [
        {
          id: `inv-${Date.now()}-1`,
          number: 'INV-001',
          clientId: `cl-${Date.now()}-1`,
          client: {
            id: `cl-${Date.now()}-1`,
            name: 'John Smith',
            email: 'john@techcorp.com',
            company: 'TechCorp Solutions'
          },
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'sent',
          subtotal: 15000,
          tax: 1275,
          total: 16275,
          items: [
            {
              id: 'item1',
              description: 'E-commerce website development',
              quantity: 100,
              rate: 150,
              amount: 15000
            }
          ],
          notes: 'Payment due within 30 days',
          terms: 'Net 30 days payment terms apply',
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0]
        },
        {
          id: `inv-${Date.now()}-2`,
          number: 'INV-002',
          clientId: `cl-${Date.now()}-2`,
          client: {
            id: `cl-${Date.now()}-2`,
            name: 'Sarah Johnson',
            email: 'sarah@designstudio.com',
            company: 'Creative Design Studio'
          },
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          status: 'overdue',
          subtotal: 8000,
          tax: 680,
          total: 8680,
          items: [
            {
              id: 'item2',
              description: 'Business strategy consulting',
              quantity: 40,
              rate: 200,
              amount: 8000
            }
          ],
          notes: 'Thank you for your business',
          terms: 'Net 30 days payment terms apply',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0]
        }
      ];
      
      await invoicesCollection.insertMany(sampleInvoices);
      console.log('✅ Created invoices collection with sample data');
    }
    
    // Create settings collection
    const settingsCollection = db.collection('settings');
    const settingsCount = await settingsCollection.countDocuments();
    
    if (settingsCount === 0) {
      const defaultSettings = {
        id: 'app_settings',
        companyName: 'Your Company Name',
        companyAddress: '123 Business Street\nCity, State 12345\nCountry',
        companyPhone: '+1 (555) 123-4567',
        companyEmail: 'info@yourcompany.com',
        companyWebsite: 'www.yourcompany.com',
        taxNumber: 'TAX-123456789',
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
        accentColor: '#06b6d4',
        invoiceTemplate: 'modern',
        currency: 'USD',
        taxRate: 8.5,
        paymentTerms: 30,
        invoiceFooter: 'Thank you for your business!',
        bankDetails: 'Bank Name: Your Bank\nAccount Number: 123456789\nRouting Number: 987654321'
      };
      
      await settingsCollection.insertOne(defaultSettings);
      console.log('✅ Created settings collection with default data');
    }
    
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
    // db is already connected and available in the outer scope
    const collections = await db.listCollections().toArray();
    res.json({ 
      success: true, 
      database: DB_NAME,
      collections: collections.map(c => c.name),
      message: 'Connected to MongoDB Atlas successfully!'
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to connect to MongoDB',
      details: error.message 
    });
  }
});

// Get all data from a collection
app.get('/api/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    let data = await db.collection(collection).find({}).toArray();
    
    // Map MongoDB _id to id for the clients collection
    if (collection === 'clients') {
      data = data.map(client => ({
        ...client,
        id: client._id.toString()
      }));
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error(`Error getting ${req.params.collection}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save data to a collection
app.post('/api/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const data = req.body;
    
    // Check if document exists (update) or create new
    if (data.id) {
      const result = await db.collection(collection).replaceOne(
        { id: data.id },
        data,
        { upsert: true }
      );
      res.json({ success: true, result, data });
    } else {
      const result = await db.collection(collection).insertOne(data);
      res.json({ success: true, result, data });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete data from a collection
app.delete('/api/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const { ObjectId } = await import('mongodb');
    
    // First try to delete by _id (MongoDB's default)
    let result = await db.collection(collection).deleteOne({ _id: new ObjectId(id) });
    
    // If no document was deleted, try with id field (for backward compatibility)
    if (result.deletedCount === 0) {
      result = await db.collection(collection).deleteOne({ id });
    }
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initialize database
app.post('/api/initialize', async (req, res) => {
  try {
    await createCollections();
    res.json({ success: true, message: 'Database initialized successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dashboard stats endpoint
app.get('/dashboard/stats', async (req, res) => {
  try {
    // Get collections
    const clientsCollection = db.collection('clients');
    const productsCollection = db.collection('products');
    const invoicesCollection = db.collection('invoices');

    // Get counts
    const [clientCount, productCount, invoiceCount] = await Promise.all([
      clientsCollection.countDocuments(),
      productsCollection.countDocuments(),
      invoicesCollection.countDocuments()
    ]);

    // Get invoice statistics
    const invoices = await invoicesCollection.find().toArray();
    
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);

    const outstandingAmount = invoices
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + inv.total, 0);

    const overdueAmount = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0);

    const stats = {
      totalRevenue,
      totalInvoices: invoiceCount,
      totalClients: clientCount,
      totalProducts: productCount,
      paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
      pendingInvoices: invoices.filter(inv => inv.status === 'sent').length,
      overdueInvoices: invoices.filter(inv => inv.status === 'overdue').length,
      outstandingAmount,
      overdueAmount
    };

    res.json(stats);
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
});

// Clients API endpoints
app.get('/api/clients', async (req, res) => {
  let db;
  try {
    const clientsCollection = db.collection('clients');
    const clients = await clientsCollection.find().toArray();
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch clients',
      details: error.message 
    });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const clientsCollection = db.collection('clients');
    const client = req.body;
    await clientsCollection.insertOne(client);
    res.json(client);
  } catch (error) {
    console.error('Failed to save client:', error);
    res.status(500).json({ error: 'Failed to save client' });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const clientsCollection = db.collection('clients');
    const result = await clientsCollection.deleteOne({ id: req.params.id });
    res.json({ success: result.deletedCount > 0 });
  } catch (error) {
    console.error('Failed to delete client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// Products API endpoints
app.get('/api/products', async (req, res) => {
  try {
    const productsCollection = db.collection('products');
    const products = await productsCollection.find().toArray();
    res.json(products);
  } catch (error) {
    console.error('Failed to get products:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const productsCollection = db.collection('products');
    const product = req.body;
    await productsCollection.insertOne(product);
    res.json(product);
  } catch (error) {
    console.error('Failed to save product:', error);
    res.status(500).json({ error: 'Failed to save product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const productsCollection = db.collection('products');
    const result = await productsCollection.deleteOne({ id: req.params.id });
    res.json({ success: result.deletedCount > 0 });
  } catch (error) {
    console.error('Failed to delete product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// TEMPORARY: Clear all clients (for testing only)
app.delete('/api/clear-clients', async (req, res) => {
  try {
    const clientsCollection = db.collection('clients');
    const result = await clientsCollection.deleteMany({});
    console.log('Cleared all clients:', result);
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Failed to clear clients:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Client deletion endpoint - FORCE VERSION
app.delete('/api/clients/:id', async (req, res) => {
  try {
    const clientsCollection = db.collection('clients');
    const clientId = req.params.id;
    console.log('🚨 ATTEMPTING TO DELETE CLIENT WITH ID:', clientId);
    
    // Try to delete by ID first
    let deleteResult = await clientsCollection.deleteOne({ id: clientId });
    
    // If not found by id, try by _id
    if (deleteResult.deletedCount === 0) {
      deleteResult = await clientsCollection.deleteOne({ _id: clientId });
    }
    
    // If still not found, try direct string match
    if (deleteResult.deletedCount === 0) {
      const allClients = await clientsCollection.find({}).toArray();
      console.log('All clients in DB:', allClients);
      
      // Try to find by string comparison
      const clientToDelete = allClients.find(c => 
        c.id?.toString() === clientId.toString() || 
        c._id?.toString() === clientId.toString()
      );
      
      if (clientToDelete?._id) {
        console.log('Found client by string comparison, deleting by _id:', clientToDelete._id);
        deleteResult = await clientsCollection.deleteOne({ _id: clientToDelete._id });
      }
    }
    
    if (deleteResult.deletedCount > 0) {
      console.log('✅ Client deleted successfully');
      return res.json({ success: true, message: 'Client deleted successfully' });
    }
    
    console.log('❌ Failed to delete client - no matching document found');
    return res.status(404).json({ 
      success: false, 
      error: 'Client not found or could not be deleted' 
    });
    
  } catch (error) {
    console.error('🔥 ERROR deleting client:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error while deleting client',
      details: error.message 
    });
  }
});

// Invoices API endpoints
app.get('/api/invoices', async (req, res) => {
  try {
    const invoicesCollection = db.collection('invoices');
    const invoices = await invoicesCollection.find().toArray();
    res.json(invoices);
  } catch (error) {
    console.error('Failed to get invoices:', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

app.post('/api/invoices', async (req, res) => {
  let db;
  try {
    db = await connectToMongoDB();
    const invoicesCollection = db.collection('invoices');
    const invoice = req.body;
    const result = await invoicesCollection.insertOne(invoice);
    res.status(201).json({ 
      success: true, 
      message: 'Invoice created successfully', 
      data: { ...invoice, _id: result.insertedId } 
    });
  } catch (error) {
    console.error('Failed to save invoice:', error);
    res.status(500).json({ error: 'Failed to save invoice' });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  let db;
  try {
    db = await connectToMongoDB();
    const invoicesCollection = db.collection('invoices');
    const result = await invoicesCollection.deleteOne({ id: req.params.id });
    res.json({ success: result.deletedCount > 0 });
  } catch (error) {
    console.error('Failed to delete invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

// Update invoice status
app.patch('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const invoicesCollection = db.collection('invoices');
    const result = await invoicesCollection.updateOne(
      { id },
      { $set: { status, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update invoice status:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
});

// Connection info endpoint
app.get('/settings/connection', async (req, res) => {
  try {
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    res.json({
      isConnected: true,
      database: db.databaseName,
      collections: collectionNames
    });
  } catch (error) {
    console.error('Failed to get connection info:', error);
    res.status(500).json({
      isConnected: false,
      database: null,
      collections: []
    });
  }
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('❌ Failed to connect to MongoDB. Server cannot start.');
      process.exit(1);
    }

    // Start Express server
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