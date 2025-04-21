import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User';
import Question from './models/Question';
import Answer from './models/Answer';

// Ethiopian names dataset
const ethiopianNames = [
  { firstName: 'Meron', lastName: 'Tekle' },
  { firstName: 'Yohannes', lastName: 'Girma' },
  { firstName: 'Selamawit', lastName: 'Mulugeta' },
  { firstName: 'Tewodros', lastName: 'Kebede' },
  { firstName: 'Alemitu', lastName: 'Tesfaye' },
  { firstName: 'Bereket', lastName: 'Assefa' },
  { firstName: 'Eyerusalem', lastName: 'Abebe' },
  { firstName: 'Fitsum', lastName: 'Gebre' },
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...');
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error connecting to MongoDB:', err.message);
    } else {
      console.error('An unknown error occurred:', err);
    }
    process.exit(1);
  }
};

// Create users
const createUsers = async () => {
  const users = [];
  
  for (const name of ethiopianNames) {
    try {
      const user = new User({
        name: `${name.firstName} ${name.lastName}`,
        email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@example.et`,
        password: await bcrypt.hash('password123', 12),
        bio: 'Software developer from Ethiopia',
        location: 'Addis Ababa, Ethiopia',
        image: `https://avatars.dicebear.com/api/initials/${name.firstName}.${name.lastName}.svg`,
      });
      users.push(await user.save());
    } catch (err) {
      console.error(`Error creating user ${name.firstName}:`, err);
    }
  }
  
  return users;
};


// Create questions
const createQuestions = async (users: { _id: mongoose.Types.ObjectId }[]) => {
  const questions = [
    {
      title: "How to implement blockchain-based land registry system in Ethiopia?",
      content: "I'm working on a blockchain solution for land registry...",
      tags: ["blockchain", "smart-contracts", "ethereum"],
    },
    {
      title: "Best practices for AI-powered Amharic text-to-speech conversion?",
      content: "I'm developing an Amharic TTS system using TensorFlow...",
      tags: ["ai", "machine-learning", "nlp"],
    },
    {
      title: "Implementing mobile banking security with biometric authentication?",
      content: "What's the best way to integrate fingerprint auth in React Native...",
      tags: ["mobile", "react-native", "security"],
    },
    {
      title: "Optimizing Python code for Ethiopian weather data analysis?",
      content: "I'm processing large CSV files from NMA...",
      tags: ["python", "data-science", "optimization"],
    },
  ];

  return Promise.all(questions.map(async (q, index) => {
    try {
      const question = new Question({
        ...q,
        author: users[index % users.length]._id,
        views: Math.floor(Math.random() * 1000),
      });
      return await question.save();
    } catch (err) {
      console.error('Error saving question:', err);
      throw err; // Ensure failure stops execution and propagates the error
    }
  }));
};



// Seed function
const seed = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Question.deleteMany();
    await Answer.deleteMany();

    // Create users
    const users = await createUsers();
    console.log(`${users.length} users created`);

    // Create questions
    const questions = await createQuestions(users);
    console.log(`${questions.length} questions created`);

 
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

// Call the seed function
seed();
