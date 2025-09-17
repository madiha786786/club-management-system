require('dotenv').config();
// ADD THESE LINES FOR THE TEST
console.log("--- DOTENV TEST ---");
console.log("MONGO_URI Variable:", process.env.MONGO_URI);
console.log("JWT_SECRET Variable:", process.env.JWT_SECRET);
console.log("---------------------");

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./middleware");
const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kmit-club";
app.use(bodyParser.json());
app.use(cors());
// MongoDB connection
mongoose.connect(MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Student Schema
const studentSchema = new mongoose.Schema({
	username: { type: String, unique: true },
	password: String,
	name: String,
	rollNumber: String,
	joinedClubs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],
	pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }]
});
const Student = mongoose.model("Student", studentSchema);
// Faculty Schema
const facultySchema = new mongoose.Schema({
	username: { type: String, unique: true },
	password: String,
	name: String,
	email: String
});
const Faculty = mongoose.model("Faculty", facultySchema);

// ClubHead Schema
const clubHeadSchema = new mongoose.Schema({
	username: { type: String, unique: true },
	password: String,
	name: String,
	club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' }
});
const ClubHead = mongoose.model("ClubHead", clubHeadSchema);

// Admin Schema
const adminSchema = new mongoose.Schema({
	username: { type: String, unique: true },
	password: String,
	name: String
});
const Admin = mongoose.model("Admin", adminSchema);
// Club Schema
const clubSchema = new mongoose.Schema({
	name: String,
	slug: { type: String, unique: true, required: true },
	headUsername: { type: String, unique: true },
	password: String,
	members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
	pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
	description: String,
	image: String
});
const Club = mongoose.model("Club", clubSchema);
// REGISTER endpoint
app.post("/register", async (req, res) => {
	try {
		const { role } = req.body;
		if (role === "student") {
			const { studentUsername, studentPassword, name, rollNumber } = req.body;
			const hashedPassword = await bcrypt.hash(studentPassword, 10);
			const student = new Student({
				username: studentUsername,
				password: hashedPassword,
				name,
				rollNumber
			});
			await student.save();
			return res.json({ message: "✅ Student registration successful" });
		}
	if (role === "faculty") {
    const { facultyEmail, facultyPassword, name } = req.body;

    // Validate email format
    const emailRegex = /^[A-Za-z]{10}[0-9]{0,3}@gmail\.com$/;
    if (!emailRegex.test(facultyEmail)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate name format
    const nameRegex = /^[A-Za-z]{1,20}$/;
    if (!nameRegex.test(name)) {
        return res.status(400).json({ error: "Invalid name format" });
    }

    // Validate password format
    const passwordRegex = /^(?=^[A-Z])(?=(?:.*[A-Za-z]){8,})(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{10,}$/;
    if (!passwordRegex.test(facultyPassword)) {
        return res.status(400).json({ error: "Invalid password format" });
    }

    const hashedPassword = await bcrypt.hash(facultyPassword, 10);
    const faculty = new Faculty({
        username: facultyEmail,
        password: hashedPassword,
        name,
        email: facultyEmail
    });
    await faculty.save();
    return res.json({ message: "✅ Faculty registration successful" });
}

		if (role === "clubhead") {
    const { clubUsername, clubPassword } = req.body;

    // Check if this clubUsername exists in the clubs collection
    const club = await Club.findOne({ headUsername: clubUsername });
    if (!club) {
        return res.status(400).json({ error: "Invalid club username." });
    }

    // Check if this club already has a head registered
    const existingHead = await ClubHead.findOne({ username: clubUsername });
    if (existingHead) {
        return res.status(400).json({ error: "This club already has a head assigned." });
    }

    // Hash password and create ClubHead
    const hashedPassword = await bcrypt.hash(clubPassword, 10);

    const clubHead = new ClubHead({
        username: clubUsername,
        password: hashedPassword,
        name: "", // you may leave it empty or extend form to collect name
        club: club._id // associate this head with the club
    });

    await clubHead.save();

    return res.json({ message: "✅ Club Head registration successful" });
}

		if (role === "admin") {
			const { adminId, adminPassword, name } = req.body;
			const hashedPassword = await bcrypt.hash(adminPassword, 10);
			const admin = new Admin({
				username: adminId,
				password: hashedPassword,
				name
			});
			await admin.save();
			return res.json({ message: "✅ Admin registration successful" });
		}
		res.status(400).json({ error: "Invalid role" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Server error" });
	}
});


// LOGIN endpoint
app.post("/login", async (req, res) => {
	try {
	const { role, username, password } = req.body;
	let user, userModel;
	if (role === "student") userModel = Student;
	else if (role === "faculty") userModel = Faculty;
	else if (role === "clubhead") userModel = ClubHead;
	else if (role === "admin") userModel = Admin;
	else return res.status(400).json({ error: "Invalid role" });

	user = await userModel.findOne({ username });
	if (!user) return res.status(401).json({ error: "Invalid credentials" });
	const valid = await bcrypt.compare(password, user.password);
	if (!valid) return res.status(401).json({ error: "Invalid credentials" });
		const token = jwt.sign({ id: user._id, role, username: user.username, name: user.name }, JWT_SECRET, { expiresIn: "1h" });

		res.json({ token, role });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Server error" });
	}
});
app.get("/student/dashboard", authenticateToken, async (req, res) => {
    if (req.user.role !== "student") return res.status(403).json({ error: "Unauthorized" });
    const student = await Student.findOne({ username: req.user.username })
        .populate('joinedClubs')
        .populate('pendingRequests');
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
});
app.get("/clubs", async (req, res) => {
    try {
        const clubs = await Club.find({}, 'name description image slug _id');
        res.json(clubs);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
// Add these 3 new endpoints to your server.js file

// 1. STUDENT: REQUEST TO JOIN A CLUB
app.post("/student/join-club", authenticateToken, async (req, res) => {
    if (req.user.role !== "student") return res.status(403).json({ error: "Unauthorized" });

    try {
        const { clubId } = req.body;
        const studentId = req.user.id; // From the JWT

        // Add request to the Club's pending list
        // Using $addToSet prevents adding duplicate requests
        await Club.findByIdAndUpdate(clubId, { $addToSet: { pendingRequests: studentId } });
        
        // Also add the club to the Student's pending list to keep them in sync
        await Student.findByIdAndUpdate(studentId, { $addToSet: { pendingRequests: clubId } });

        res.json({ message: "Request sent successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 2. CLUB HEAD: GET DASHBOARD DATA (INCL. REQUESTS AND MEMBERS)
app.get("/clubhead/dashboard", authenticateToken, async (req, res) => {
    if (req.user.role !== "clubhead") return res.status(403).json({ error: "Unauthorized" });

    try {
        // Find the club head to know which club they manage
        const clubHead = await ClubHead.findById(req.user.id);
         console.log("DEBUG: Checking Club Head:", clubHead); 
        if (!clubHead) return res.status(404).json({ error: "Club head not found" });


        // Find the club and populate the details of students in pendingRequests and members
        const clubData = await Club.findById(clubHead.club)
            .populate('pendingRequests', 'name username rollNumber') // Get student details
            .populate('members', 'name username rollNumber');        // Get member details

        if (!clubData) return res.status(404).json({ error: "Club data not found" });
        
        res.json(clubData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 3. CLUB HEAD: RESPOND TO A JOIN REQUEST (ACCEPT/REJECT)
app.post("/clubhead/respond", authenticateToken, async (req, res) => {
    if (req.user.role !== "clubhead") return res.status(403).json({ error: "Unauthorized" });
    
    try {
        const { studentId, action } = req.body; // action can be "accept" or "reject"
        const clubHead = await ClubHead.findById(req.user.id);
        const clubId = clubHead.club;

        // Step A: Remove student from the pending list in both Club and Student documents
        await Club.findByIdAndUpdate(clubId, { $pull: { pendingRequests: studentId } });
        await Student.findByIdAndUpdate(studentId, { $pull: { pendingRequests: clubId } });

        // Step B: If accepted, add student to the members list in both documents
        if (action === "accept") {
            await Club.findByIdAndUpdate(clubId, { $addToSet: { members: studentId } });
            await Student.findByIdAndUpdate(studentId, { $addToSet: { joinedClubs: clubId } });
        }

        res.json({ message: `Request has been ${action}ed.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// Server running
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
