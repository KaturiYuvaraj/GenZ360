/**
 * GenZ360 Core Entities: Type-safe Domain Models
 * Supporting: Student, College, Ground Owner, Employer, Internship, Project, Certificate, Placement
 */

export type PartnershipTier = "bronze" | "silver" | "gold" | "platinum";
export type HiringTier = "standard" | "growth" | "enterprise";
export type PlacementStatus = "seeking" | "shortlisted" | "placed" | "higher_studies" | "opted_out";
export type OfferStatus = "offered" | "accepted" | "joined" | "rejected";
export type DriveStatus = "draft" | "upcoming" | "ongoing" | "completed" | "cancelled";
export type WorkMode = "remote" | "hybrid" | "onsite";
export type ProjectDifficulty = "beginner" | "intermediate" | "advanced";
export type CertificateIssuerType = "genz360" | "employer" | "college" | "partner";

export interface College {
  id: string;
  name: string;
  slug: string;
  code?: string | null;
  city: string;
  state?: string | null;
  address?: string | null;
  accreditation: string;
  tpoName?: string | null;
  tpoEmail?: string | null;
  tpoPhone?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  mouSigned: boolean;
  partnershipTier: PartnershipTier;
  sportsFacilities: string;
  totalStudents: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroundOwner {
  id: string;
  userId: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  payoutBankUpi?: string | null;
  commissionRate: number;
  verified: boolean;
  groundsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Employer {
  id: string;
  userId?: string | null;
  companyName: string;
  slug: string;
  logoUrl?: string | null;
  website?: string | null;
  industry: string;
  companySize: "1-10" | "11-50" | "51-200" | "201-500" | "500+";
  headquarters?: string | null;
  city?: string | null;
  about?: string | null;
  hiringTier: HiringTier;
  verified: boolean;
  activeJobsCount: number;
  isExternal?: boolean;
  atsType?: string | null;
  atsIdentifier?: string | null;
  careersUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobSourceEntity {
  id: string;
  name: string;
  companyId?: string | null;
  companyName: string;
  companySlug: string;
  boardIdentifier: string;
  careersUrl?: string | null;
  enabled: boolean;
  lastSyncAt?: string | null;
  lastSuccessAt?: string | null;
  lastError?: string | null;
  errorCount: number;
  totalJobsCount: number;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillRating {
  skillId: string;
  name: string;
  score: number;
  verified: boolean;
}

export interface Student {
  id: string;
  userId: string;
  collegeId?: string | null;
  collegeName?: string | null;
  rollNumber?: string | null;
  degree: string;
  branch: string;
  batchYear: number;
  cgpa: number;
  activeBacklogs: number;
  wellnessScore: number;
  sportsAttendanceCount: number;
  primarySport: string;
  resumeUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  placementStatus: PlacementStatus;
  skillsMatrix: SkillRating[];
  pointsBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface InternshipEntity {
  id: string;
  employerId?: string | null;
  company: string;
  role: string;
  category: string;
  skills: string;
  duration: string;
  location: string;
  remote: boolean;
  workMode: WorkMode;
  stipend: number;
  openings: number;
  deadline: string;
  description: string;
  status: "draft" | "active" | "closed";
  collegeCreditEligible: boolean;
  postedBy?: string | null;
  createdAt: string;
}

export interface ProjectEntity {
  id: string;
  employerId?: string | null;
  title: string;
  company: string;
  sponsorName?: string | null;
  category: string;
  skills: string;
  difficulty: ProjectDifficulty;
  teamSize: number;
  sprintCurrent: number;
  sprintTotal: number;
  tasksDone: number;
  tasksTotal: number;
  progress: number;
  stipendReward: number;
  mentor: string;
  summary: string;
  deliverables: string;
  seatsOpen: number;
  certificationEligible: boolean;
  createdAt: string;
}

export interface CertificateEntity {
  id: string;
  certCode: string;
  userId?: string | null;
  studentName: string;
  title: string;
  skill: string;
  project?: string | null;
  issuerType: CertificateIssuerType;
  issuerId?: string | null;
  issuedOn: string;
  verified: boolean;
  badgeIconUrl?: string | null;
  verificationUrl?: string | null;
  credentialHash?: string | null;
}

export interface PlacementEntity {
  id: string;
  studentId: string;
  studentName?: string;
  employerId: string;
  employerName?: string;
  collegeId?: string | null;
  collegeName?: string | null;
  jobId?: string | null;
  packageLpa: number;
  designation: string;
  status: OfferStatus;
  offerLetterUrl?: string | null;
  placedAt: string;
  createdAt: string;
}

export interface PlacementDriveEntity {
  id: string;
  collegeId: string;
  collegeName?: string;
  employerId: string;
  employerName?: string;
  roleTitle: string;
  driveDate: string;
  status: DriveStatus;
  eligibleBranches: string[];
  minCgpa: number;
  maxBacklogs: number;
  registeredCount: number;
  createdAt: string;
}
