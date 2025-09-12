import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seedExamData() {
  try {
    console.log('Creating sample exam data...');
    
    // Get existing data
    const classes = await db.select().from(schema.classes);
    const subjects = await db.select().from(schema.subjects);
    const users = await db.select().from(schema.users);
    const academicTerms = await db.select().from(schema.academicTerms);

    if (classes.length === 0 || subjects.length === 0 || users.length === 0 || academicTerms.length === 0) {
      console.log('Missing required data. Please ensure classes, subjects, users, and academic terms exist first.');
      return;
    }

    const teacherUser = users.find(u => u.roleId === 2); // Teacher role
    const defaultClass = classes[0];
    const defaultSubject = subjects[0];
    const defaultTerm = academicTerms[0];

    if (!teacherUser) {
      console.log('No teacher user found. Please create a teacher first.');
      return;
    }

    // Create sample exams
    const sampleExams = [
      {
        name: 'Mathematics Mid-term Exam',
        classId: defaultClass.id,
        subjectId: defaultSubject.id,
        totalMarks: 100,
        date: '2024-12-20',
        termId: defaultTerm.id,
        createdBy: teacherUser.id,
        timeLimit: 90,
        instructions: 'Read all questions carefully. Show your work for partial credit. No calculators allowed.',
        isPublished: true,
        allowRetakes: false,
        shuffleQuestions: true,
      },
      {
        name: 'Science Quiz',
        classId: defaultClass.id,
        subjectId: defaultSubject.id,
        totalMarks: 50,
        date: '2024-12-18',
        termId: defaultTerm.id,
        createdBy: teacherUser.id,
        timeLimit: 45,
        instructions: 'Multiple choice and short answer questions about basic science concepts.',
        isPublished: true,
        allowRetakes: true,
        shuffleQuestions: false,
      }
    ];

    for (const examData of sampleExams) {
      const [exam] = await db.insert(schema.exams).values(examData).returning();
      console.log(`Created exam: ${exam.name}`);

      // Add sample questions for each exam
      if (exam.name.includes('Mathematics')) {
        // Math questions
        const mathQuestions = [
          {
            examId: exam.id,
            questionText: 'What is the value of x in the equation 2x + 5 = 13?',
            questionType: 'multiple_choice',
            points: 10,
            orderNumber: 1,
          },
          {
            examId: exam.id,
            questionText: 'Calculate the area of a rectangle with length 8 units and width 5 units.',
            questionType: 'text',
            points: 15,
            orderNumber: 2,
          },
          {
            examId: exam.id,
            questionText: 'Solve for y: 3y - 7 = 2y + 8',
            questionType: 'multiple_choice',
            points: 10,
            orderNumber: 3,
          }
        ];

        for (const questionData of mathQuestions) {
          const [question] = await db.insert(schema.examQuestions).values(questionData).returning();
          
          // Add options for multiple choice questions
          if (question.questionType === 'multiple_choice') {
            if (question.questionText.includes('2x + 5 = 13')) {
              const options = [
                { questionId: question.id, optionText: 'x = 4', isCorrect: true, orderNumber: 1 },
                { questionId: question.id, optionText: 'x = 5', isCorrect: false, orderNumber: 2 },
                { questionId: question.id, optionText: 'x = 6', isCorrect: false, orderNumber: 3 },
                { questionId: question.id, optionText: 'x = 7', isCorrect: false, orderNumber: 4 },
              ];
              for (const optionData of options) {
                await db.insert(schema.questionOptions).values(optionData);
              }
            } else if (question.questionText.includes('3y - 7 = 2y + 8')) {
              const options = [
                { questionId: question.id, optionText: 'y = 12', isCorrect: false, orderNumber: 1 },
                { questionId: question.id, optionText: 'y = 15', isCorrect: true, orderNumber: 2 },
                { questionId: question.id, optionText: 'y = 18', isCorrect: false, orderNumber: 3 },
                { questionId: question.id, optionText: 'y = 21', isCorrect: false, orderNumber: 4 },
              ];
              for (const optionData of options) {
                await db.insert(schema.questionOptions).values(optionData);
              }
            }
          }
        }
      } else if (exam.name.includes('Science')) {
        // Science questions
        const scienceQuestions = [
          {
            examId: exam.id,
            questionText: 'What is the chemical symbol for water?',
            questionType: 'multiple_choice',
            points: 5,
            orderNumber: 1,
          },
          {
            examId: exam.id,
            questionText: 'Which planet is closest to the Sun?',
            questionType: 'multiple_choice',
            points: 5,
            orderNumber: 2,
          },
          {
            examId: exam.id,
            questionText: 'Explain the process of photosynthesis in plants.',
            questionType: 'essay',
            points: 15,
            orderNumber: 3,
          }
        ];

        for (const questionData of scienceQuestions) {
          const [question] = await db.insert(schema.examQuestions).values(questionData).returning();
          
          if (question.questionType === 'multiple_choice') {
            if (question.questionText.includes('water')) {
              const options = [
                { questionId: question.id, optionText: 'H2O', isCorrect: true, orderNumber: 1 },
                { questionId: question.id, optionText: 'CO2', isCorrect: false, orderNumber: 2 },
                { questionId: question.id, optionText: 'O2', isCorrect: false, orderNumber: 3 },
                { questionId: question.id, optionText: 'NaCl', isCorrect: false, orderNumber: 4 },
              ];
              for (const optionData of options) {
                await db.insert(schema.questionOptions).values(optionData);
              }
            } else if (question.questionText.includes('planet')) {
              const options = [
                { questionId: question.id, optionText: 'Venus', isCorrect: false, orderNumber: 1 },
                { questionId: question.id, optionText: 'Mercury', isCorrect: true, orderNumber: 2 },
                { questionId: question.id, optionText: 'Earth', isCorrect: false, orderNumber: 3 },
                { questionId: question.id, optionText: 'Mars', isCorrect: false, orderNumber: 4 },
              ];
              for (const optionData of options) {
                await db.insert(schema.questionOptions).values(optionData);
              }
            }
          }
        }
      }
    }

    console.log('Exam data seeded successfully!');
    console.log('Sample exams created:');
    console.log('- Mathematics Mid-term Exam (90 min, 100 points)');
    console.log('- Science Quiz (45 min, 50 points)');
    
  } catch (error) {
    console.error('Error seeding exam data:', error);
  }
}

seedExamData();