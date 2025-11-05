const PDFDocument = require('pdfkit');
const Booking = require('../models/BookingModel');

// Generate PDF invoice
const generateInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('truck', 'title type')
      .populate('owner', 'name email phone address')
      .populate('customer', 'name email phone address');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check authorization
    if (req.user.role === 'customer' && booking.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (req.user.role === 'owner' && booking.owner._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const filename = `invoice-${booking._id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('CargoNepal', { align: 'center' });
    doc.fontSize(16).text('Invoice', { align: 'center' });
    doc.moveDown();

    // Booking Info
    doc.fontSize(14).text(`Booking ID: ${booking._id}`, { align: 'left' });
    doc.text(`Date: ${new Date(booking.createdAt).toLocaleDateString()}`, { align: 'left' });
    doc.moveDown();

    // Customer Info
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', { continued: false });
    doc.font('Helvetica').text(booking.customer.name);
    if (booking.customer.address) doc.text(booking.customer.address);
    doc.text(booking.customer.email);
    doc.moveDown();

    // Service Provider Info
    doc.font('Helvetica-Bold').text('Service Provider:', { continued: false });
    doc.font('Helvetica').text(booking.owner.name);
    if (booking.owner.address) doc.text(booking.owner.address);
    doc.text(booking.owner.email);
    doc.moveDown();

    // Route Info
    doc.font('Helvetica-Bold').text('Route:', { continued: false });
    doc.font('Helvetica').text(`Pickup: ${booking.pickup?.address || 'N/A'}`);
    doc.text(`Dropoff: ${booking.dropoff?.address || 'N/A'}`);
    doc.text(`Distance: ${booking.distanceKm} km`);
    doc.moveDown();

    // Service Details
    doc.font('Helvetica-Bold').text('Service Details:', { continued: false });
    doc.font('Helvetica').text(`Truck: ${booking.truck.title}`);
    doc.text(`Type: ${booking.truck.type || 'N/A'}`);
    doc.text(`Rate: Rs. ${booking.truck.ratePerKm}/km`);
    doc.moveDown();

    // Amount
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(`Total Amount: Rs. ${booking.price}`, { align: 'right' });
    doc.moveDown();

    // Footer
    doc.fontSize(10).font('Helvetica').text('Thank you for using CargoNepal!', { align: 'center' });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generateInvoice };

