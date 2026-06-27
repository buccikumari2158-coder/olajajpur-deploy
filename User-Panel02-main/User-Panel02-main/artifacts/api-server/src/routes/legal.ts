import { Router } from "express";

const router = Router();

const LEGAL_DOCS: Record<string, { title: string; body: string }> = {
  terms: {
    title: "Terms & Conditions",
    body: `Welcome to Jajpur Jatri. By using our service, you agree to these terms.

1. SERVICE USE
Jajpur Jatri connects passengers with drivers for transportation services within Jajpur and surrounding areas.

2. USER ACCOUNTS
You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials.

3. DRIVER STANDARDS
All drivers must hold a valid driving licence and comply with local transport regulations. Drivers must maintain vehicle roadworthiness at all times.

4. PAYMENTS
Fares are calculated at ₹15 per kilometre. Payment can be made via cash, wallet, or online payment. All transactions are final unless a dispute is raised within 24 hours.

5. CANCELLATIONS
Passengers may cancel a ride before a driver is assigned. Repeated cancellations may result in account suspension.

6. LIABILITY
Jajpur Jatri is a technology platform connecting passengers and drivers. We are not liable for incidents during the ride beyond what is required by applicable law.

7. PRIVACY
We collect and process your data as described in our Privacy Policy. Location data is used only during active rides.

8. CHANGES
We may update these terms at any time. Continued use of the service constitutes acceptance of updated terms.

For questions, contact support at jajpurjatri@gmail.com or call +91 9583789411.`,
  },
  privacy: {
    title: "Privacy Policy",
    body: `Jajpur Jatri respects your privacy. This policy explains what data we collect and how we use it.

1. DATA WE COLLECT
- Phone number and name for account creation
- Location data during active rides
- Payment information (processed securely; we do not store card details)
- Trip history and ratings

2. HOW WE USE YOUR DATA
- To connect you with drivers or passengers
- To process payments and maintain wallet balance
- To improve the service and resolve disputes
- To send service notifications (no marketing without consent)

3. DATA SHARING
We share your name and phone number with your matched driver/passenger for coordination purposes only. We do not sell your data to third parties.

4. LOCATION DATA
Driver location is tracked only during active rides. Passenger location is used to find nearby drivers. No location data is retained after ride completion beyond aggregated statistics.

5. DATA RETENTION
Account data is retained while your account is active. You may request deletion by contacting support.

6. SECURITY
We use industry-standard encryption for all data in transit. Passwords are hashed and never stored in plain text.

7. CONTACT
For privacy questions, contact jajpurjatri@gmail.com or call +91 9583789411.`,
  },
};

router.get("/legal/:slug", (req, res) => {
  const { slug } = req.params;
  const doc = LEGAL_DOCS[slug];
  if (!doc) {
    res.status(404).json({ message: "Document not found" });
    return;
  }
  res.json({
    slug,
    title: doc.title,
    body: doc.body,
    externalUrl: `https://jajpurjatri.in/legal/${slug}`,
  });
});

export default router;
