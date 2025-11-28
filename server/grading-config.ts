export interface GradeRange {
  min: number;
  max: number;
  grade: string;
  points: number;
  remarks: string;
}

export interface GradingConfig {
  name: string;
  ranges: GradeRange[];
  scoreAggregationMode: 'last' | 'best' | 'average';
  testWeight: number;
  examWeight: number;
}

export const STANDARD_GRADING_SCALE: GradingConfig = {
  name: 'standard',
  scoreAggregationMode: 'last',
  testWeight: 40,
  examWeight: 60,
  ranges: [
    { min: 90, max: 100, grade: 'A+', points: 4.0, remarks: 'Excellent' },
    { min: 80, max: 89, grade: 'A', points: 3.7, remarks: 'Very Good' },
    { min: 70, max: 79, grade: 'B+', points: 3.3, remarks: 'Good' },
    { min: 60, max: 69, grade: 'B', points: 3.0, remarks: 'Satisfactory' },
    { min: 50, max: 59, grade: 'C', points: 2.0, remarks: 'Pass' },
    { min: 40, max: 49, grade: 'D', points: 1.0, remarks: 'Below Average' },
    { min: 0, max: 39, grade: 'F', points: 0.0, remarks: 'Fail' },
  ]
};

export const GRADING_SCALES: Record<string, GradingConfig> = {
  standard: STANDARD_GRADING_SCALE,
  waec: {
    name: 'waec',
    scoreAggregationMode: 'last',
    testWeight: 40,
    examWeight: 60,
    ranges: [
      { min: 75, max: 100, grade: 'A1', points: 1.0, remarks: 'Excellent' },
      { min: 70, max: 74, grade: 'B2', points: 2.0, remarks: 'Very Good' },
      { min: 65, max: 69, grade: 'B3', points: 3.0, remarks: 'Good' },
      { min: 60, max: 64, grade: 'C4', points: 4.0, remarks: 'Credit' },
      { min: 55, max: 59, grade: 'C5', points: 5.0, remarks: 'Credit' },
      { min: 50, max: 54, grade: 'C6', points: 6.0, remarks: 'Credit' },
      { min: 45, max: 49, grade: 'D7', points: 7.0, remarks: 'Pass' },
      { min: 40, max: 44, grade: 'E8', points: 8.0, remarks: 'Pass' },
      { min: 0, max: 39, grade: 'F9', points: 9.0, remarks: 'Fail' },
    ]
  },
  percentage: {
    name: 'percentage',
    scoreAggregationMode: 'last',
    testWeight: 40,
    examWeight: 60,
    ranges: [
      { min: 90, max: 100, grade: '90-100%', points: 4.0, remarks: 'Outstanding' },
      { min: 80, max: 89, grade: '80-89%', points: 3.5, remarks: 'Excellent' },
      { min: 70, max: 79, grade: '70-79%', points: 3.0, remarks: 'Very Good' },
      { min: 60, max: 69, grade: '60-69%', points: 2.5, remarks: 'Good' },
      { min: 50, max: 59, grade: '50-59%', points: 2.0, remarks: 'Fair' },
      { min: 40, max: 49, grade: '40-49%', points: 1.5, remarks: 'Pass' },
      { min: 0, max: 39, grade: '0-39%', points: 0.0, remarks: 'Fail' },
    ]
  }
};

export function getGradingConfig(scaleName: string = 'standard'): GradingConfig {
  return GRADING_SCALES[scaleName] || STANDARD_GRADING_SCALE;
}

export function calculateGrade(percentage: number, scaleName: string = 'standard'): GradeRange {
  const config = getGradingConfig(scaleName);
  const normalizedPercentage = Math.max(0, Math.min(100, Math.round(percentage)));
  
  for (const range of config.ranges) {
    if (normalizedPercentage >= range.min && normalizedPercentage <= range.max) {
      return range;
    }
  }
  
  return config.ranges[config.ranges.length - 1];
}

export function calculateWeightedScore(
  testScore: number | null, 
  testMaxScore: number | null,
  examScore: number | null,
  examMaxScore: number | null,
  scaleName: string = 'standard'
): { weightedScore: number; percentage: number; testWeighted: number; examWeighted: number } {
  const config = getGradingConfig(scaleName);
  
  let testWeighted = 0;
  let examWeighted = 0;
  let totalWeight = 0;
  
  if (testScore !== null && testMaxScore !== null && testMaxScore > 0) {
    const testPercentage = (testScore / testMaxScore) * 100;
    testWeighted = (testPercentage / 100) * config.testWeight;
    totalWeight += config.testWeight;
  }
  
  if (examScore !== null && examMaxScore !== null && examMaxScore > 0) {
    const examPercentage = (examScore / examMaxScore) * 100;
    examWeighted = (examPercentage / 100) * config.examWeight;
    totalWeight += config.examWeight;
  }
  
  const weightedScore = testWeighted + examWeighted;
  const percentage = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
  
  return {
    weightedScore: Math.round(weightedScore * 10) / 10,
    percentage: Math.round(percentage * 10) / 10,
    testWeighted: Math.round(testWeighted * 10) / 10,
    examWeighted: Math.round(examWeighted * 10) / 10
  };
}

export function aggregateScores(
  scores: number[],
  mode: 'last' | 'best' | 'average'
): number {
  if (scores.length === 0) return 0;
  
  switch (mode) {
    case 'last':
      return scores[scores.length - 1];
    case 'best':
      return Math.max(...scores);
    case 'average':
      return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    default:
      return scores[scores.length - 1];
  }
}

export function calculateClassPosition(
  studentAverage: number,
  allAverages: number[]
): { position: number; totalStudents: number } {
  const sortedAverages = [...allAverages].sort((a, b) => b - a);
  const position = sortedAverages.findIndex(avg => avg === studentAverage) + 1;
  
  return {
    position: position || allAverages.length,
    totalStudents: allAverages.length
  };
}

export function getOverallGrade(averagePercentage: number, scaleName: string = 'standard'): string {
  const gradeInfo = calculateGrade(averagePercentage, scaleName);
  return gradeInfo.grade;
}

export function calculateGPA(grades: string[], scaleName: string = 'standard'): number {
  const config = getGradingConfig(scaleName);
  
  if (grades.length === 0) return 0;
  
  let totalPoints = 0;
  let count = 0;
  
  for (const grade of grades) {
    const gradeInfo = config.ranges.find(r => r.grade === grade);
    if (gradeInfo) {
      totalPoints += gradeInfo.points;
      count++;
    }
  }
  
  return count > 0 ? Math.round((totalPoints / count) * 100) / 100 : 0;
}
