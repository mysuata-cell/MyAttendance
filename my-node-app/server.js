const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ================= MONGOOSE SCHEMAS =================

// អនុញ្ញាតឱ្យ Browser ទាញយក static files (index.html, logo.png, manifest.json)
app.use(express.static(__dirname)); 
// ឬបើក static តាម folder បច្ចុប្បន្ន
app.use(express.static(path.join(__dirname)));

// 1. Schema សិស្ស
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gender: { type: String, required: true },
  dob: { type: String, required: true },
  className: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Student = mongoose.model('Student', studentSchema);

// 2. Schema មុខវិជ្ជា
const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});
const Subject = mongoose.model('Subject', subjectSchema);

// 3. Schema អវត្តមានប្រចាំខែ
const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true },
  className: { type: String, required: true },
  month: { type: String, required: true },
  days: { type: Map, of: String, default: {} },
  updatedAt: { type: Date, default: Date.now }
});
const Attendance = mongoose.model('Attendance', attendanceSchema);

// 4. Schema ពិន្ទុសិស្ស
const scoreSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  subject: { type: String, required: true },
  month: { type: String, required: true },
  examScore: { type: Number, default: 0 },
  attendanceScore: { type: Number, default: 0 },
  disciplineScore: { type: Number, default: 0 },
  activityScore: { type: Number, default: 0 },
  homeworkScore: { type: Number, default: 0 },
  bookCheckScore: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
const Score = mongoose.model('Score', scoreSchema);

// 5. Schema អត្ថបទ / មេរៀន (បន្ថែមថ្មី)
const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  className: { type: String, default: '' },
  subject: { type: String, default: '' },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  signature: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
const Article = mongoose.model('Article', articleSchema);

// 6. Schema កំណត់បង្ហាញប្រជុំ (បន្ថែមថ្មី)
const meetingSchema = new mongoose.Schema({
  number: { type: String, required: true },
  agenda: { type: String, required: true },
  content: { type: String, default: '' },
  month: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Meeting = mongoose.model('Meeting', meetingSchema);

// ================= API ROUTES =================

// --- 1. STUDENT APIs ---
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.json({ message: "រក្សាទុកសិស្សជោគជ័យ!", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: "កែប្រែសិស្សជោគជ័យ!", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "លុបសិស្សជោគជ័យ!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2. SUBJECT APIs ---
app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subjects', async (req, res) => {
  try {
    const { name } = req.body;
    const exists = await Subject.findOne({ name });
    if (exists) return res.status(400).json({ error: "មុខវិជ្ជានេះមានរួចហើយ!" });

    const newSubject = new Subject({ name });
    await newSubject.save();
    res.json({ message: "បន្ថែមមុខវិជ្ជាជោគជ័យ!", subject: newSubject });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. ATTENDANCE APIs ---
app.get('/api/attendance', async (req, res) => {
  try {
    const { className, month } = req.query;
    if (!className || !month) return res.json([]);

    const students = await Student.find({ className }).sort({ name: 1 });
    const attRecords = await Attendance.find({ className, month });

    const result = students.map(st => {
      const record = attRecords.find(r => r.studentId.toString() === st._id.toString());
      return {
        studentId: st._id,
        studentName: st.name,
        gender: st.gender,
        className: st.className,
        days: record ? Object.fromEntries(record.days) : {}
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Article by ID
app.get('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // ប្រសិនបើប្រើ MongoDB / Mongoose
    const article = await Article.findById(id); 
    
    if (!article) {
      return res.status(404).json({ message: "រកមិនឃើញអត្ថបទនេះទេ" });
    }
    
    res.json(article);
  } catch (error) {
    res.status(500).json({ message: "មានបញ្ហា Server", error: error.message });
  }
});

app.post('/api/attendance/save', async (req, res) => {
  try {
    const { className, month, attendanceData } = req.body;

    for (let item of attendanceData) {
      await Attendance.findOneAndUpdate(
        { studentId: item.studentId, month: month },
        { 
          studentId: item.studentId,
          studentName: item.studentName,
          className: className,
          month: month,
          days: item.days,
          updatedAt: Date.now()
        },
        { upsert: true, new: true }
      );
    }

    res.json({ message: "បានរក្សាទុកសម្រង់អវត្តមានជោគជ័យ!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 4. SCORE APIs ---
app.get('/api/scores', async (req, res) => {
  try {
    const scores = await Score.find().sort({ createdAt: -1 });
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scores', async (req, res) => {
  try {
    const { 
      studentName, subject, month, 
      examScore, attendanceScore, disciplineScore, 
      activityScore, homeworkScore, bookCheckScore 
    } = req.body;

    const totalScore = (Number(examScore) || 0) + 
                       (Number(attendanceScore) || 0) + 
                       (Number(disciplineScore) || 0) + 
                       (Number(activityScore) || 0) + 
                       (Number(homeworkScore) || 0) + 
                       (Number(bookCheckScore) || 0);

    const newScore = new Score({ 
      studentName, subject, month, 
      examScore, attendanceScore, disciplineScore, 
      activityScore, homeworkScore, bookCheckScore, 
      totalScore 
    });

    await newScore.save();
    res.json({ message: "បញ្ចូលពិន្ទុជោគជ័យ!", score: newScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/scores/:id', async (req, res) => {
  try {
    const { 
      studentName, subject, month, 
      examScore, attendanceScore, disciplineScore, 
      activityScore, homeworkScore, bookCheckScore 
    } = req.body;

    const totalScore = (Number(examScore) || 0) + 
                       (Number(attendanceScore) || 0) + 
                       (Number(disciplineScore) || 0) + 
                       (Number(activityScore) || 0) + 
                       (Number(homeworkScore) || 0) + 
                       (Number(bookCheckScore) || 0);

    const updatedScore = await Score.findByIdAndUpdate(
      req.params.id, 
      { 
        studentName, subject, month, 
        examScore, attendanceScore, disciplineScore, 
        activityScore, homeworkScore, bookCheckScore, 
        totalScore 
      }, 
      { new: true }
    );

    res.json({ message: "កែប្រែពិន្ទុជោគជ័យ!", score: updatedScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/scores/:id', async (req, res) => {
  try {
    await Score.findByIdAndDelete(req.params.id);
    res.json({ message: "លុបទិន្នន័យពិន្ទុជោគជ័យ!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 5. ARTICLE APIs ---
app.get('/api/articles', async (req, res) => {
  try {
    const { className, subject } = req.query;
    let query = {};
    if (className) query.className = className;
    if (subject) query.subject = subject;

    const articles = await Article.find(query).sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/articles', async (req, res) => {
  try {
    const article = new Article(req.body);
    await article.save();
    res.json({ message: "រក្សាទុកអត្ថបទជោគជ័យ!", article });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 បន្ថែម ROUTE នេះ (PUT /api/articles/:id) ដែលខ្វះ៖
app.put('/api/articles/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!article) {
      return res.status(404).json({ message: "រកមិនឃើញអត្ថបទដើម្បីកែប្រែឡើយ" });
    }

    res.json({ message: "កែប្រែអត្ថបទជោគជ័យ!", article });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/articles/:id', async (req, res) => {
  try {
    await Article.findByIdAndDelete(req.params.id);
    res.json({ message: "លុបអត្ថបទជោគជ័យ!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 6. MEETING APIs ---
app.get('/api/meetings', async (req, res) => {
  try {
    const { month } = req.query;
    let query = {};
    if (month) query.month = month;

    const meetings = await Meeting.find(query).sort({ createdAt: -1 });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/meetings', async (req, res) => {
  try {
    const meeting = new Meeting(req.body);
    await meeting.save();
    res.json({ message: "រក្សាទុកកិច្ចប្រជុំជោគជ័យ!", meeting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/meetings/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: "កែប្រែកិច្ចប្រជុំជោគជ័យ!", meeting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/meetings/:id', async (req, res) => {
  try {
    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ message: "លុបកិច្ចប្រជុំជោគជ័យ!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'manifest.json'));
});

// ================= CONNECT MONGO & LISTEN =================
const MONGO_URI = 'mongodb://127.0.0.1:27017/teacher_db';
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ បានតភ្ជាប់ទៅ MongoDB រួចរាល់');
    app.listen(PORT, () => console.log(`🚀 Server កំពុងរត់លើ http://localhost:${PORT}`));
  })
  .catch(err => console.error('❌ បរាជ័យក្នុងការតភ្ជាប់ MongoDB:', err));