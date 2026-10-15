import { getSql } from "../db.ts";
import { CURRICULUM_CATALOG } from "./curriculumData.ts";

let seeded = false;
let seeding: Promise<void> | null = null;

export async function ensureSeeded() {
  if (seeded) return;
  if (seeding) return seeding;
  seeding = (async () => {
    const sql = await getSql();

    // 1. Ensure grounds table upgrades
    try {
      await sql`alter table grounds add column if not exists owner_user_id text;`;
      await sql`update grounds set owner_name = 'Smash Arena Sports Complex' where id = 'gnd_kora' and owner_name = 'Playyard Sports';`;
    } catch {
      // Columns may already exist
    }

    // 2. Seed grounds and core catalog if empty
    const groundRows = await sql<{ n: number }>`select count(*)::int as n from grounds`.catch(() => [{ n: 0 }]);
    if ((groundRows[0]?.n ?? 0) === 0) {
      await sql`
        insert into grounds (id, name, slug, city, locality, description, image_url, price_per_hour, rating, review_count, facilities, pitch_type, owner_name, lat, lng) values
        ('gnd_kora', 'Koramangala Box', 'koramangala-box', 'Bengaluru', '5th Block, Koramangala', 'Enclosed floodlit box with bowling machine, turf pitch and changing bays. Built for weekday evenings and college derbies.', '/grounds/koramangala.jpg', 900, 4.8, 214, 'Turf pitch,Bowling machine,Floodlights,Changing room,Parking,Water', 'Box turf', 'Smash Arena Sports Complex', 12.9352, 77.6245),
        ('gnd_powai', 'Powai Floodlit Cage', 'powai-floodlit', 'Mumbai', 'Powai Lake Road', 'Open-air cage under tower lights. Fast outfield, netted boundaries, weekend corporate slots held until 9pm.', '/grounds/powai.jpg', 1200, 4.6, 167, 'Floodlights,Nets,Seating,Cafe,Parking', 'Box turf', 'Lakeview Arena', 19.1238, 72.9089),
        ('gnd_chen', 'Anna Nagar College Nets', 'anna-nagar-nets', 'Chennai', 'Anna Nagar West', 'Three-lane practice nets on red soil and turf. Shared with two city colleges. Mornings for academies, evenings for box matches.', '/grounds/chennai.jpg', 700, 4.4, 98, 'Practice nets,Bowling machine,Pavilion,Lockers', 'Practice nets', 'Marina Sports Trust', 13.0878, 80.2101),
        ('gnd_hyd', 'HITEC Weekend Box', 'hitec-weekend-box', 'Hyderabad', 'HITEC City', 'Compact cage with LED roof, shoe racks and a live scoring tablet. Designed for 6-a-side after office.', '/grounds/hyderabad.jpg', 850, 4.7, 141, 'LED roof,Scoring tablet,Water,Lockers,First aid', 'Indoor box', 'Deccan Pitch Co.', 17.4483, 78.3915),
        ('gnd_ggn', 'Cyber Hub Pavilion', 'cyber-hub-pavilion', 'Gurugram', 'Cyber Hub', 'Premium turf with glass pavilion and timed corporate bookings. Boundary sensors, broadcast-ready lights.', '/grounds/gurugram.jpg', 1600, 4.9, 88, 'Pavilion cafe,Broadcast lights,Turf,Lockers,Valet', 'Premium turf', 'North Arena', 28.4950, 77.0888),
        ('gnd_pune', 'Mutha Riverside Nets', 'mutha-riverside', 'Pune', 'Sinhagad Road', 'Open nets beside the river. Golden-hour slots go first. Quiet, cheap, serious for batters who want throwdowns.', '/grounds/pune.jpg', 650, 4.5, 76, 'Open nets,River view,Parking,Coaching', 'Open nets', 'Western Ghats Cricket', 18.4575, 73.8077)
      `;

      await sql`
        insert into tournaments (id, name, kind, city, venue, start_date, end_date, fee, teams_registered, max_teams, description) values
        ('trn_blr_night', 'Bengaluru Night Box League', 'college', 'Bengaluru', 'Koramangala Box', '2026-09-20', '2026-10-18', 2500, 11, 16, 'Eight-week 6-a-side night league for campus sides. Yellow ball, 8 overs, no-limit hitting.'),
        ('trn_mum_corp', 'Powai Corporate Cup', 'corporate', 'Mumbai', 'Powai Floodlit Cage', '2026-09-27', '2026-10-04', 4000, 8, 12, 'Four-day knockout for company teams. Includes kit, umpire and after-match board.'),
        ('trn_chn_open', 'Marina Weekend Open', 'weekend', 'Chennai', 'Anna Nagar College Nets', '2026-09-13', '2026-09-14', 1500, 14, 16, 'Saturday-Sunday open draw. College and club mixed. Fast registration, slower bowling.'),
        ('trn_hyd_uni', 'Deccan University Shield', 'college', 'Hyderabad', 'HITEC Weekend Box', '2026-10-03', '2026-11-01', 2000, 6, 16, 'Inter-college box cricket. Points table live on GenZ360.'),
        ('trn_pune_tapri', 'Sinhagad Tapri Cup', 'weekend', 'Pune', 'Mutha Riverside Nets', '2026-09-19', '2026-09-20', 800, 9, 12, 'Casual weekend, serious fielding. Chai included, sledging optional.')
      `;

      await sql`
        insert into matches (id, tournament_id, home_team, away_team, match_date, result, status) values
        ('mt_1', 'trn_chn_open', 'Loyola Strikers', 'SRM Pacers', '2026-09-13', null, 'upcoming'),
        ('mt_2', 'trn_blr_night', 'RVCE Royals', 'BMS Smashers', '2026-09-20', null, 'upcoming'),
        ('mt_3', 'trn_mum_corp', 'Razorpay XI', 'CRED Club', '2026-09-27', null, 'upcoming'),
        ('mt_4', 'trn_chn_open', 'Anna University', 'VIT Chennai', '2026-08-30', 'Anna University won by 12 runs', 'completed')
      `;

      await sql`
        insert into skills (id, name, category, level, summary, demand) values
        ('sk_react', 'React', 'Coding', 'Core', 'Interfaces that ship. Components, data, and the boring parts that make products feel finished.', 96),
        ('sk_ai', 'Applied AI', 'AI', 'Rising', 'Retrieval, evaluation, and products that do not hallucinate their way through a demo.', 94),
        ('sk_ux', 'UI / UX', 'UI/UX', 'Core', 'Not moodboards. Flows, type, and the last 10% that makes a recruiter stay on the screen.', 88),
        ('sk_test', 'Testing', 'Testing', 'Core', 'Playwright, fixtures, the difference between coverage and confidence.', 81),
        ('sk_cloud', 'Cloud', 'Cloud', 'Core', 'Ship on something that stays up. Linux, containers, boring reliability.', 86),
        ('sk_mkt', 'Digital Marketing', 'Digital Marketing', 'Applied', 'Campaigns with numbers attached. Not vanity reach.', 74),
        ('sk_node', 'Node.js', 'Coding', 'Core', 'APIs, auth, queues. The unglamorous spine of every campus product.', 91),
        ('sk_sql', 'SQL', 'Coding', 'Core', 'If you cannot query it, you do not understand it.', 89),
        ('sk_figma', 'Interface systems', 'UI/UX', 'Core', 'Tokens, components, and handing a file a developer can actually build.', 83),
        ('sk_mlops', 'Eval & MLOps', 'AI', 'Rising', 'The part after the notebook. Logging, eval sets, cost.', 79)
      `;

      await sql`
        insert into internships (id, company, role, category, skills, duration, location, remote, stipend, deadline, description) values
        ('int_rzp', 'Razorpay', 'Product Engineering Intern', 'Coding', 'React,Node.js,SQL', '3 months', 'Bengaluru', false, 40000, '2026-10-05', 'Work on merchant dashboard surfaces. You will ship behind a flag, sit in reviews, and own a metric.'),
        ('int_zoho', 'Zoho', 'Frontend Intern', 'Coding', 'React,UI/UX,Testing', '6 months', 'Chennai', false, 25000, '2026-09-28', 'Long-form product work. Less glamour, more craft. You will learn to live inside a design system.'),
        ('int_cred', 'CRED', 'Design Intern', 'UI/UX', 'UI/UX,Figma,Motion', '3 months', 'Bengaluru', false, 35000, '2026-10-12', 'Member surfaces, not marketing pages. High taste bar. Bring a case study, not a Dribbble dump.'),
        ('int_ather', 'Ather Energy', 'Firmware-adjacent Intern', 'Cloud', 'C,Linux,Cloud', '4 months', 'Bengaluru', false, 30000, '2026-10-01', 'Vehicle software is not a hackathon. Telemetry, reliability, and the occasional 6am scooter.'),
        ('int_unac', 'Unacademy', 'Growth Intern', 'Digital Marketing', 'Digital Marketing,SQL,Copy', '3 months', 'Remote', true, 20000, '2026-09-22', 'Own a funnel for one exam vertical. Creative, measurement, weekly write-up.'),
        ('int_frs', 'Freshworks', 'QA Intern', 'Testing', 'Testing,Playwright,SQL', '6 months', 'Chennai', false, 22000, '2026-10-08', 'You will break things on purpose and write it down so nobody has to guess.'),
        ('int_post', 'Postman', 'Developer Relations Intern', 'Coding', 'Node.js,Writing,React', '3 months', 'Bengaluru', true, 28000, '2026-10-15', 'Samples, collections, and explaining APIs to people who have not slept.'),
        ('int_khat', 'Khatabook', 'Data Intern', 'AI', 'SQL,Python,Applied AI', '3 months', 'Pune', false, 25000, '2026-09-30', 'Merchant insights. Messy data. Real questions from the field team.')
      `;

      await sql`
        insert into projects (id, title, company, category, skills, team_size, sprint_current, sprint_total, tasks_done, tasks_total, progress, mentor, summary, seats_open) values
        ('prj_hire', 'AI Recruitment Desk', 'GenZ360 Labs', 'AI', 'React,Applied AI,Node.js', 4, 3, 5, 18, 23, 78, 'Meera Iyer', 'A recruiter desk that reads projects and certificates, not just keywords. Live with three partner employers.', 1),
        ('prj_box', 'Campus Sports OS', 'Playyard', 'Sports tech', 'React,SQL,Cloud', 5, 2, 4, 11, 20, 55, 'Arjun Deshpande', 'Slotting, umpires, and a points table that colleges will actually open on Monday morning.', 2),
        ('prj_pay', 'Stipend Ledger', 'Razorpay Campus', 'Fintech', 'Node.js,SQL,React', 3, 4, 5, 16, 19, 84, 'Niharika Shah', 'Track internship stipends without a spreadsheet dying in a group chat.', 1),
        ('prj_ux', 'Certificate Studio', 'GenZ360 Labs', 'UI/UX', 'UI/UX,React,Testing', 4, 1, 3, 4, 14, 28, 'Kabir Menon', 'A verification-first certificate. Printable, linkable, unfakeable enough.', 2),
        ('prj_eval', 'Skill Eval Harness', 'Unacademy', 'AI', 'Applied AI,Python,Testing', 4, 2, 6, 9, 24, 38, 'Dr. Anitha Rao', 'Question banks with leakage checks. The unsexy layer under every assessment.', 2),
        ('prj_mkt', 'Placement Pulse', 'Zoho Schools', 'Growth', 'Digital Marketing,SQL,React', 3, 3, 4, 12, 16, 70, 'Farhan Qureshi', 'A weekly digest colleges send to recruiters. Built as a product, not a PDF.', 1)
      `;

      await sql`
        insert into sprints (id, project_id, number, title, status) values
        ('sp_hire_1', 'prj_hire', 1, 'Ingest resumes & projects', 'done'),
        ('sp_hire_2', 'prj_hire', 2, 'Ranker + recruiter filters', 'done'),
        ('sp_hire_3', 'prj_hire', 3, 'Interview scheduling', 'active'),
        ('sp_hire_4', 'prj_hire', 4, 'Offer loop', 'todo'),
        ('sp_hire_5', 'prj_hire', 5, 'Campus rollout', 'todo')
      `;

      await sql`
        insert into tasks (id, project_id, sprint_id, title, status, assignee) values
        ('tk_1', 'prj_hire', 'sp_hire_3', 'Slot picker for interviewers', 'doing', 'Ananya'),
        ('tk_2', 'prj_hire', 'sp_hire_3', 'ICS export', 'todo', 'Vikram'),
        ('tk_3', 'prj_hire', 'sp_hire_3', 'No-show reminders', 'done', 'Sara'),
        ('tk_4', 'prj_box', 'sp_hire_3', 'Ground conflict detection', 'doing', 'Dev'),
        ('tk_5', 'prj_box', null, 'Umpire check-in', 'todo', null)
      `;

      await sql`
        insert into assessments (id, title, kind, skill, duration_min, questions, summary) values
        ('as_js', 'JavaScript Foundations', 'coding', 'React', 45, 18, 'Language, async, and the mistakes that show up in internships.'),
        ('as_sql', 'SQL for product work', 'coding', 'SQL', 40, 16, 'Joins, windows, and reading an explain-ish result without panic.'),
        ('as_ai', 'Applied AI judgement', 'ai', 'Applied AI', 35, 14, 'When to retrieve, when to refuse, how to eval a prompt change.'),
        ('as_ux', 'Interface critique', 'design', 'UI/UX', 30, 10, 'You are given a broken flow. Write what you would change, in order.'),
        ('as_apt', 'Campus aptitude', 'aptitude', 'General', 25, 20, 'The filter every placement cell still runs. Timed, clean, no trick riddles.')
      `;

      await sql`
        insert into jobs (id, company, role, category, skills, location, remote, ctc_lpa, type, description) values
        ('job_rzp', 'Razorpay', 'Graduate Engineer', 'Coding', 'React,Node.js,SQL', 'Bengaluru', false, 18.0, 'full_time', 'Product engineering. You will be on a squad, not a training bench.'),
        ('job_zoho', 'Zoho', 'Member Technical Staff', 'Coding', 'Java,SQL,Testing', 'Chennai', false, 10.0, 'full_time', 'Long product cycles. Depth over theatre.'),
        ('job_cred', 'CRED', 'Associate Product Designer', 'UI/UX', 'UI/UX,Figma,React', 'Bengaluru', false, 16.0, 'full_time', 'Member products. Portfolio must show systems, not isolated screens.'),
        ('job_frs', 'Freshworks', 'QA Engineer I', 'Testing', 'Testing,Playwright,SQL', 'Chennai', false, 9.0, 'full_time', 'Quality as engineering. Automate the boring, argue the rest.'),
        ('job_post', 'Postman', 'Developer Advocate I', 'Coding', 'Writing,Node.js,React', 'Bengaluru', true, 14.0, 'full_time', 'Explain complex things without becoming a mascot.'),
        ('job_ather', 'Ather Energy', 'Software Engineer — Vehicle', 'Cloud', 'C++,Linux,Cloud', 'Bengaluru', false, 15.0, 'full_time', 'Ships that people sit on. Reliability is the feature.'),
        ('job_khb', 'Khatabook', 'Data Analyst', 'AI', 'SQL,Python,Applied AI', 'Pune', false, 11.0, 'full_time', 'Field-shaped questions. You will visit a merchant at least once.')
      `;

      await sql`
        insert into certificates (id, user_id, student_name, title, skill, project, issued_on, verified) values
        ('GZ360-9F2C18', null, 'Ananya Krishnan', 'Live Project — AI Recruitment Desk', 'Applied AI', 'AI Recruitment Desk', '2026-08-21', true),
        ('GZ360-4B71AA', null, 'Vikram Chauhan', 'Skill — React', 'React', null, '2026-07-12', true),
        ('GZ360-C3E901', null, 'Sara Merchant', 'Internship — Product Engineering', 'Node.js', 'Razorpay', '2026-06-30', true)
      `;

      await sql`
        insert into campus_drives (id, college_name, company, role, drive_date, status) values
        ('cd_1', 'RV College of Engineering', 'Razorpay', 'Graduate Engineer', '2026-10-14', 'upcoming'),
        ('cd_2', 'College of Engineering, Guindy', 'Zoho', 'Member Technical Staff', '2026-10-08', 'upcoming'),
        ('cd_3', 'COEP Pune', 'Khatabook', 'Data Analyst', '2026-09-29', 'upcoming')
      `;
    }

    // 3. Seed skill curriculum modules and lessons if empty
    try {
      const modRows = await sql<{ n: number }>`select count(*)::int as n from skill_modules`.catch(() => [{ n: 0 }]);
      if ((modRows[0]?.n ?? 0) === 0) {
        for (const [skillId, curr] of Object.entries(CURRICULUM_CATALOG)) {
          for (const mod of curr.modules) {
            await sql`
              insert into skill_modules (id, skill_id, module_number, title, duration_hours, summary)
              values (${mod.id}, ${skillId}, ${mod.module_number}, ${mod.title}, ${mod.duration_hours}, ${mod.summary})
              on conflict (id) do nothing
            `;
            for (const les of mod.lessons) {
              await sql`
                insert into skill_lessons (id, module_id, lesson_number, title, kind, duration_min, key_takeaway, exercise_prompt)
                values (${les.id}, ${mod.id}, ${les.lesson_number}, ${les.title}, ${les.kind}, ${les.duration_min}, ${les.key_takeaway}, ${les.exercise_prompt})
                on conflict (id) do nothing
              `;
            }
          }
        }
      }
    } catch {
      // ignore
    }

    // 4. Seed partner colleges if empty
    try {
      const colRows = await sql<{ n: number }>`select count(*)::int as n from colleges`.catch(() => [{ n: 0 }]);
      if ((colRows[0]?.n ?? 0) === 0) {
        await sql`
          insert into colleges (id, name, slug, code, city, state, accreditation, tpo_name, tpo_email, mou_signed, partnership_tier, total_students) values
          ('col_rvce', 'RV College of Engineering', 'rvce-bengaluru', 'RVCE-BLR', 'Bengaluru', 'Karnataka', 'NAAC A++', 'Dr. Shanmuga Priya', 'tpo@rvce.edu.in', true, 'platinum', 4200),
          ('col_ceg', 'College of Engineering, Guindy', 'ceg-anna-univ', 'CEG-CHN', 'Chennai', 'Tamil Nadu', 'NAAC A++', 'Prof. K. Ramesh', 'placements@annauniv.edu', true, 'platinum', 5100),
          ('col_coep', 'COEP Technological University', 'coep-pune', 'COEP-PUN', 'Pune', 'Maharashtra', 'NAAC A+', 'Dr. Arvind Joshi', 'tpo@coep.ac.in', true, 'gold', 3800),
          ('col_bms', 'BMS College of Engineering', 'bmsce-bengaluru', 'BMS-BLR', 'Bengaluru', 'Karnataka', 'NAAC A++', 'Dr. H. N. Suma', 'placements@bmsce.ac.in', true, 'gold', 4600),
          ('col_vjti', 'Veermata Jijabai Technological Institute', 'vjti-mumbai', 'VJTI-MUM', 'Mumbai', 'Maharashtra', 'NAAC A+', 'Prof. V. M. Phalle', 'tpo@vjti.ac.in', true, 'gold', 3400)
          on conflict (id) do nothing
        `;
      }
    } catch {
      // Colleges table may be migrating
    }

    // 5. Seed verified employers if empty
    try {
      const empRows = await sql<{ n: number }>`select count(*)::int as n from employers`.catch(() => [{ n: 0 }]);
      if ((empRows[0]?.n ?? 0) === 0) {
        await sql`
          insert into employers (id, user_id, company_name, slug, website, industry, company_size, headquarters, city, hiring_tier, verified, active_jobs_count) values
          ('emp_rzp', 'usr_emp_rzp', 'Razorpay', 'razorpay', 'https://razorpay.com', 'Fintech & Payments', '500+', 'Bengaluru', 'Bengaluru', 'enterprise', true, 4),
          ('emp_zoho', 'usr_emp_zoho', 'Zoho Corporation', 'zoho', 'https://zoho.com', 'Enterprise SaaS', '500+', 'Chennai', 'Chennai', 'enterprise', true, 6),
          ('emp_cred', 'usr_emp_cred', 'CRED', 'cred', 'https://cred.club', 'Consumer Tech', '201-500', 'Bengaluru', 'Bengaluru', 'growth', true, 3),
          ('emp_fresh', 'usr_emp_fresh', 'Freshworks', 'freshworks', 'https://freshworks.com', 'Customer Software SaaS', '500+', 'Chennai', 'Chennai', 'enterprise', true, 5),
          ('emp_postman', 'usr_emp_postman', 'Postman', 'postman', 'https://postman.com', 'Developer Tools', '201-500', 'Bengaluru', 'Bengaluru', 'growth', true, 2)
          on conflict (id) do nothing
        `;
      }
    } catch {
      // Employers table may be migrating
    }

    // 6. Seed verified student builders and profiles if empty
    try {
      const stuProfileRows = await sql<{ n: number }>`
        select count(*)::int as n from profiles where role = 'student'
      `.catch(() => [{ n: 0 }]);

      if ((stuProfileRows[0]?.n ?? 0) === 0) {
        const studentProfiles = [
          {
            userId: "usr_cand_1",
            displayName: "Ananya Krishnan",
            headline: "Full-Stack & Applied AI Builder · Live Sprint Squad Lead",
            city: "Bengaluru",
            orgName: "RV College of Engineering",
            course: "B.Tech Computer Science",
            yearOfStudy: "Final Year (2026)",
            rollNumber: "1RV22CS045",
            collegeId: "col_rvce",
            degree: "B.Tech",
            branch: "Computer Science",
            batchYear: 2026,
            cgpa: 9.20,
            wellnessScore: 94,
            sportsAttendance: 18,
            primarySport: "Box Cricket",
            placementStatus: "seeking",
            skillsMatrix: "React, TypeScript, Applied AI, Node.js, Python",
            pointsBalance: 750,
          },
          {
            userId: "usr_cand_2",
            displayName: "Vikram Chauhan",
            headline: "Frontend & Design Engineer · Open-Source Contributor",
            city: "Bengaluru",
            orgName: "BMS College of Engineering",
            course: "B.Tech Information Science",
            yearOfStudy: "Final Year (2026)",
            rollNumber: "1BM22IS089",
            collegeId: "col_bms",
            degree: "B.Tech",
            branch: "Information Science",
            batchYear: 2026,
            cgpa: 8.80,
            wellnessScore: 88,
            sportsAttendance: 14,
            primarySport: "Badminton",
            placementStatus: "shortlisted",
            skillsMatrix: "React, TailwindCSS, Figma, UI/UX, Next.js",
            pointsBalance: 620,
          },
          {
            userId: "usr_cand_3",
            displayName: "Sara Merchant",
            headline: "Backend & Systems Engineer · Distributed Caching Lead",
            city: "Chennai",
            orgName: "College of Engineering, Guindy",
            course: "B.Tech Computer Science",
            yearOfStudy: "Final Year (2025)",
            rollNumber: "2021CEGCS012",
            collegeId: "col_ceg",
            degree: "B.Tech",
            branch: "Computer Science",
            batchYear: 2025,
            cgpa: 9.00,
            wellnessScore: 82,
            sportsAttendance: 9,
            primarySport: "Football",
            placementStatus: "seeking",
            skillsMatrix: "Node.js, Go, PostgreSQL, Redis, Docker",
            pointsBalance: 540,
          },
          {
            userId: "usr_cand_4",
            displayName: "Dev Patel",
            headline: "Cloud & DevOps Specialist · Linux Core Systems",
            city: "Pune",
            orgName: "COEP Technological University",
            course: "B.Tech Electronics & Telecomm",
            yearOfStudy: "Final Year (2026)",
            rollNumber: "COEP2022ET034",
            collegeId: "col_coep",
            degree: "B.Tech",
            branch: "Electronics & Comm",
            batchYear: 2026,
            cgpa: 8.60,
            wellnessScore: 90,
            sportsAttendance: 16,
            primarySport: "Box Cricket",
            placementStatus: "interview_scheduled",
            skillsMatrix: "Kubernetes, AWS, Python, Linux, Terraform",
            pointsBalance: 680,
          },
          {
            userId: "usr_cand_5",
            displayName: "Meera Iyer",
            headline: "Machine Learning & Data Analyst · NLP Researcher",
            city: "Bengaluru",
            orgName: "RV College of Engineering",
            course: "B.Tech Data Science",
            yearOfStudy: "Final Year (2025)",
            rollNumber: "1RV21DS019",
            collegeId: "col_rvce",
            degree: "B.Tech",
            branch: "Data Science",
            batchYear: 2025,
            cgpa: 9.40,
            wellnessScore: 85,
            sportsAttendance: 11,
            primarySport: "Basketball",
            placementStatus: "seeking",
            skillsMatrix: "Python, PyTorch, SQL, Scikit-Learn, Fastify",
            pointsBalance: 810,
          },
          {
            userId: "usr_cand_6",
            displayName: "Rahul Sharma",
            headline: "Full-Stack Engineer · Fintech Payment Workflows",
            city: "Mumbai",
            orgName: "Veermata Jijabai Technological Institute",
            course: "B.Tech Computer Engineering",
            yearOfStudy: "Final Year (2026)",
            rollNumber: "VJTI22CS102",
            collegeId: "col_vjti",
            degree: "B.Tech",
            branch: "Computer Science",
            batchYear: 2026,
            cgpa: 8.50,
            wellnessScore: 86,
            sportsAttendance: 12,
            primarySport: "Box Cricket",
            placementStatus: "seeking",
            skillsMatrix: "React, Node.js, SQL, Express, REST APIs",
            pointsBalance: 510,
          },
        ];

        for (const s of studentProfiles) {
          await sql`
            insert into profiles (user_id, role, display_name, headline, city, org_name, course, year_of_study)
            values (
              ${s.userId}, 'student', ${s.displayName}, ${s.headline}, ${s.city}, ${s.orgName}, ${s.course}, ${s.yearOfStudy}
            )
            on conflict (user_id) do update set
              display_name = excluded.display_name,
              headline = excluded.headline,
              city = excluded.city,
              org_name = excluded.org_name;
          `;

          await sql`
            insert into students (
              id, user_id, college_id, roll_number, degree, branch, batch_year, cgpa,
              wellness_score, sports_attendance_count, primary_sport, placement_status,
              skills_matrix, points_balance
            ) values (
              ${"stu_" + s.userId}, ${s.userId}, ${s.collegeId}, ${s.rollNumber}, ${s.degree}, ${s.branch},
              ${s.batchYear}, ${s.cgpa}, ${s.wellnessScore}, ${s.sportsAttendance}, ${s.primarySport},
              ${s.placementStatus}, ${s.skillsMatrix}, ${s.pointsBalance}
            )
            on conflict (user_id) do update set
              cgpa = excluded.cgpa,
              wellness_score = excluded.wellness_score,
              sports_attendance_count = excluded.sports_attendance_count,
              skills_matrix = excluded.skills_matrix;
          `;
        }
      }
    } catch {
      // Students or profiles table may be migrating
    }

    // 7. Update certificates cert_code if null
    try {
      await sql`
        update certificates set
          cert_code = id,
          verification_url = '/verify/' || id,
          credential_hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        where cert_code is null;
      `;
    } catch {
      // Certificates upgrade
    }

    // 9. Ensure complete role details and company career application URLs for all jobs
    try {
      await sql`
        update jobs set
          application_url = 'https://razorpay.com/jobs/',
          source_url = 'https://razorpay.com/jobs/',
          department = 'Product Engineering',
          experience_level = 'entry',
          employment_type = 'full_time',
          description = 'About Razorpay:
Razorpay is India''s leading full-stack fintech platform powering digital payments, banking, and payroll infrastructure for over 10 million businesses including Swiggy, Zomato, and Flipkart.

About the Role & Squad:
As a Graduate Engineer, you will join an active product engineering squad on day one. You will not be relegated to a training bench—you will architect, ship, and scale core checkout, payment routing, and settlement infrastructure processing millions of transactions per day.

Key Responsibilities:
• Build high-availability, low-latency microservices and responsive merchant dashboards using React, TypeScript, and Node.js.
• Design robust RESTful and GraphQL APIs integrated with distributed SQL databases and message queues.
• Write high-coverage automated unit, integration, and regression tests to maintain 99.99% uptime SLAs.
• Collaborate with Product Managers, Designers, and Lead Engineers to deliver frictionless payment flows.
• Monitor production metrics, debug distributed tracing issues, and participate in code reviews.

Eligibility & Candidate Requirements:
• Degree: B.Tech / B.E / M.Tech / MCA in Computer Science, Information Technology, or related quantitative disciplines.
• Eligible Batches: 2024, 2025, and 2026 graduating students.
• Academic Criteria: Minimum 7.0 CGPA (or 70%) with zero active backlogs.
• Technical Skills: Solid grasp of Data Structures, Algorithms, React, Node.js, SQL, and system design fundamentals.
• Builder Mindset: Strong first-principles problem-solving approach, high ownership, and curiosity.

Compensation & Benefits:
• Fixed CTC: ₹18.0 LPA + comprehensive joining bonuses and annual performance incentives.
• Premium health insurance coverage (₹5,00,000 family floater + OPD benefits).
• Annual learning & conference sponsorship allowance (₹50,000/year).
• Top-spec 16" Apple MacBook Pro and dedicated home workstation stipend.
• Unlimited coffee, gourmet catered campus meals, and sports turf access.

Hiring & Selection Process:
1. Application Review & GenZ360 Verified Passport Screening
2. Online Algorithmic Assessment (90 minutes, 3 coding problems)
3. Technical Problem Solving & Coding Round (Data Structures & Core CS)
4. Full-Stack / Systems Discussion (React, Node.js, Database Design)
5. Engineering Manager & Cultural Fit Interview'
        where id = 'job_rzp';
      `;

      await sql`
        update jobs set
          application_url = 'https://www.zoho.com/careers/',
          source_url = 'https://www.zoho.com/careers/',
          department = 'Core Engineering',
          experience_level = 'entry',
          employment_type = 'full_time',
          description = 'About Zoho:
Zoho Corporation is a global technology leader with over 55+ software products serving 100+ million users worldwide, built entirely organically without external venture capital.

About the Role:
As a Member of Technical Staff (MTS), you will dive deep into foundational software engineering. Zoho values deep algorithmic thinking, internal tooling, and self-hosted infrastructure over shallow frameworks.

Key Responsibilities:
• Write clean, robust, and highly maintainable Java and multi-threaded backend applications.
• Design and optimize relational databases, data pipelines, and internal storage engines for high concurrency.
• Develop server-side logic and scalable network protocols powering Zoho''s suite of enterprise SaaS applications.
• Debug memory leaks, thread contention, and garbage collection pauses in production JVM clusters.
• Build reusable libraries, internal testing harnesses, and automated regression suites.

Eligibility & Candidate Requirements:
• Degree: B.Tech / B.E in CS, IT, ECE, EEE or MCA (2024, 2025, or 2026 batches).
• Academics: Minimum 6.5 CGPA with no pending arrears at the time of joining.
• Technical Skills: Strong command of Core Java, C/C++, Data Structures, Algorithms, and Relational Database principles.
• Problem Solving: Deep patience for debugging complex systems and building tools from scratch.

Compensation & Benefits:
• CTC: ₹10.0 LPA + annual performance increments and company profit share.
• Full health coverage, on-campus medical care, and family insurance benefits.
• World-class rural and city campus facilities with sports grounds, gyms, and organic farms.
• Zero bond, continuous learning culture, and direct mentorship from veteran architects.

Hiring & Selection Process:
1. General Aptitude & Problem Solving Screening
2. Advanced C / Java Coding & Algorithmic Debugging
3. Technical Core Concepts Round (OS, Networking, DBMS, OOP)
4. HR & Culture Alignment Interview'
        where id = 'job_zoho';
      `;

      await sql`
        update jobs set
          application_url = 'https://careers.cred.club/',
          source_url = 'https://careers.cred.club/',
          department = 'Design & Experience',
          experience_level = 'entry',
          employment_type = 'full_time',
          description = 'About CRED:
CRED is a member-only club of trustworthy individuals that rewards financial discipline, offering cutting-edge consumer tech, commerce, and credit products renowned for design perfection.

About the Role:
As an Associate Product Designer, you will shape the future of high-trust member experiences. At CRED, design is not an afterthought or skin—it is the core product differentiator.

Key Responsibilities:
• Design intuitive, beautiful mobile and web user journeys from initial wireframes to pixel-perfect micro-interactions.
• Partner closely with frontend engineers to build and maintain CRED''s Neumorphic and fluid design systems.
• Prototype complex micro-animations and sound-enhanced haptic interactions in Figma and React.
• Conduct user feedback sessions, analyze teardowns, and iterate relentlessly on delight and clarity.
• Create high-fidelity assets, typographic hierarchies, and design specifications.

Eligibility & Candidate Requirements:
• Degree: Any Bachelor''s or Master''s degree (Design, HCI, Engineering, or self-taught builders).
• Portfolio Requirement: A portfolio showcasing end-to-end design thinking, systems architecture, and mobile UI flows.
• Tools: Mastery of Figma, auto-layout, design tokens, prototyping tools, and working familiarity with React/CSS.
• Aesthetics: An obsession with typography, pacing, color science, and spatial layouts.

Compensation & Benefits:
• CTC: ₹16.0 LPA + ESOP grants and high-performance incentives.
• Comprehensive health and mental wellness coverage.
• Annual equipment and creative subscription allowance.
• Gourmet club meals, barista coffee, and premium wellness stipends.

Hiring & Selection Process:
1. Portfolio Review & Case Study Deep-Dive
2. Design Challenge & Live Wireframing Whiteboard
3. Design System & Interaction Polish Round
4. Founder / Design Leadership Culture Fit'
        where id = 'job_cred';
      `;

      await sql`
        update jobs set
          application_url = 'https://www.freshworks.com/company/careers/',
          source_url = 'https://www.freshworks.com/company/careers/',
          department = 'Quality Engineering',
          experience_level = 'entry',
          employment_type = 'full_time',
          description = 'About Freshworks:
Freshworks makes business software people love. Over 60,000 businesses trust Freshdesk, Freshsales, and Freshservice for customer delight.

About the Role:
As QA Engineer I, you treat testing as a first-class engineering discipline. You will design, build, and maintain automated quality infrastructure that gates production deployments.

Key Responsibilities:
• Develop automated test suites using Playwright, TypeScript, and Python for cloud applications.
• Write exploratory test plans and regression tests across web, mobile, and API surfaces.
• Integrate automated test runners into GitHub Actions and CI/CD pipelines.
• Collaborate with developers to reproduce, diagnose, and triage customer-reported defects.

Eligibility & Requirements:
• Degree: B.Tech / B.E / MCA in Computer Science or related engineering.
• Skills: Playwright / Selenium, JavaScript/TypeScript, SQL, API testing (Postman).
• Min CGPA: 6.5 with no active backlogs.

Compensation & Perks:
• CTC: ₹9.0 LPA + healthcare, learning allowance, and flexible hybrid setup.'
        where id = 'job_frs';
      `;

      await sql`
        update jobs set
          application_url = 'https://www.postman.com/company/careers/',
          source_url = 'https://www.postman.com/company/careers/',
          department = 'Developer Relations',
          experience_level = 'entry',
          employment_type = 'full_time',
          description = 'About Postman:
Postman is the world''s leading API platform used by 30+ million developers and 500,000 organizations to build, test, and document modern APIs.

About the Role:
As a Developer Advocate I, you bridge product engineering and the global developer community. You will write code samples, tutorials, and open-source tooling.

Key Responsibilities:
• Build demo applications and boilerplate templates showcasing Postman API workflows.
• Write high-quality technical blog posts, documentation guides, and video walkthroughs.
• Engage with developer communities at hackathons, conferences, and university workshops.
• Gather product feedback from developers and advocate for feature improvements internally.

Eligibility & Requirements:
• Degree: B.Tech / B.E or passionate self-taught developers.
• Skills: Clear technical writing, Node.js, React, REST / GraphQL APIs.
• Strong empathy for beginner and professional developers alike.

Compensation & Perks:
• CTC: ₹14.0 LPA (100% remote) + home office stipend, wellness allowance, and global travel budget.'
        where id = 'job_post';
      `;

      await sql`
        update jobs set
          application_url = 'https://www.atherenergy.com/careers/',
          source_url = 'https://www.atherenergy.com/careers/',
          department = 'Embedded & Cloud Systems',
          experience_level = 'entry',
          employment_type = 'full_time',
          description = 'About Ather Energy:
Ather Energy is pioneering smart, connected electric vehicles in India, engineering high-performance scooters, battery packs, and charging infrastructure.

About the Role:
As a Software Engineer — Vehicle Systems, you will write software for machines people physically ride. Reliability, safety, and deterministic real-time performance are paramount.

Key Responsibilities:
• Develop embedded Linux and C++ applications for vehicle dashboards and telemetry units.
• Connect onboard sensors and ECUs to cloud backend streams over 4G/CAN-bus networks.
• Optimize battery management telemetry algorithms and predictive range estimates.
• Build automated hardware-in-the-loop (HIL) test suites.

Eligibility & Requirements:
• Degree: B.Tech in CS, ECE, EEE, or Mechatronics.
• Skills: C++, Linux, Git, OS concepts, Networking protocols.
• Min CGPA: 7.0 with no active backlogs.

Compensation & Perks:
• CTC: ₹15.0 LPA + EV purchase discounts, insurance, and campus charging perks.'
        where id = 'job_ather';
      `;

      await sql`
        update jobs set
          application_url = 'https://khatabook.com/careers/',
          source_url = 'https://khatabook.com/careers/',
          department = 'Data & Analytics',
          experience_level = 'entry',
          employment_type = 'full_time',
          description = 'About Khatabook:
Khatabook empowers 10+ million MSMEs across India with digital bookkeeping, invoicing, and lending solutions designed for grassroots merchants.

About the Role:
As a Data Analyst, you will translate merchant transaction behaviors into strategic product insights, conducting cohort analyses and building predictive growth models.

Key Responsibilities:
• Write complex SQL queries and Python data pipelines to analyze user retention and churn.
• Build interactive dashboards in Metabase/Tableau for product and business teams.
• Design and analyze A/B tests for feature launches and merchant engagement campaigns.
• Partner directly with field operations and visit merchants to understand real-world pain points.

Eligibility & Requirements:
• Degree: Any quantitative degree (Engineering, Math, Statistics, Economics).
• Skills: SQL, Python (Pandas/NumPy), Data Storytelling, Basic Applied AI/ML.
• Min CGPA: 6.5.

Compensation & Perks:
• CTC: ₹11.0 LPA + performance bonuses, health insurance, and hybrid work flexibility.'
        where id = 'job_khb';
      `;
    } catch (e) {
      console.warn("Failed to update seed jobs:", e);
    }

    seeded = true;
  })();
  try {
    await seeding;
  } finally {
    seeding = null;
  }
}
