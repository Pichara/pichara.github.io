import vidaViva from "./assets/project-vida-viva.svg";
import autoHighlights from "./assets/project-autohighlights.svg";
import gabaritech from "./assets/project-gabaritech.svg";
import lanMessaging from "./assets/project-lan.svg";
import lockText from "./assets/project-locktext.svg";
import conhacks from "./assets/project-conhacks.svg";
import librarySystem from "./assets/project-library.svg";

export const profile = {
  name: "Rodrigo Pichara Gomes",
  shortName: "Rodrigo \"Pichara\" Gomes",
  role: "Software Engineer | Backend, Python, AI, Cybersecurity",
  location: "Waterloo, Ontario, Canada",
  email: "rodrigopichara7@gmail.com",
  github: "https://github.com/Pichara",
  linkedin: "https://www.linkedin.com/in/rodrigo-pichara-gomes-a6202a27b/",
  tagline:
    "Brazilian software engineer focused on secure backend systems, Python tooling, and AI-driven products.",
  summaryShort:
    "Brazilian software engineer based in Waterloo, Ontario. Studying Software Engineering Technology at Conestoga College with an expected 2027 graduation.",
  summaryLong:
    "Rodrigo \"Pichara\" Gomes is a Brazilian software engineer based in Waterloo, Ontario. He is studying Software Engineering Technology at Conestoga College and expects to graduate in 2027. Outside of classes he works on freelance projects and participates in bug-bounty programs, building a strong appreciation for security and quality. He enjoys backend development, Python, AI, and cybersecurity, speaks English, Portuguese, and Spanish, and regularly contributes to workshops and hackathons.",
  languages: ["English", "Portuguese", "Spanish"]
};

export const stats = [
  { label: "Daily users supported", value: "400+" },
  { label: "ConHacks 2025", value: "2nd Place" },
  { label: "Spoken languages", value: "3" }
];

export const skills = {
  languages: ["Python", "C", "C#", "SQL", "HTML/CSS"],
  frameworks: [
    ".NET Core",
    "Django",
    "NumPy",
    "Pandas",
    "PyTorch",
    "Kivy",
    "SQLAlchemy"
  ],
  tools: [
    "Docker",
    "Kubernetes",
    "AWS",
    "Git",
    "CI/CD pipelines",
    "SQL Server",
    "MongoDB",
    "Firebase",
    "Linux"
  ],
  interests: [
    "Backend development",
    "Python development",
    "Cybersecurity",
    "Artificial intelligence",
    "Ethical hacking"
  ]
};

export const timeline = [
  {
    title: "Executive Team Lead",
    org: "Google Developer Group",
    location: "Waterloo, ON",
    period: "Oct 2025 – Present",
    description:
      "Create and coordinate workshops and hackathons focused on Google technologies, including capture-the-flag competitions on offensive cybersecurity. Co-organized a DevFest event with 100+ attendees.",
    type: "leadership"
  },
  {
    title: "Python Developer",
    org: "Vida Viva",
    location: "Brazil",
    period: "Jan 2023 – Jun 2023",
    description:
      "Built a patient and materials registration system using Python. Replaced paper-based workflows, improved data reliability, and supported 400+ daily users.",
    type: "work"
  },
  {
    title: "Software Engineering Technology",
    org: "Conestoga College",
    location: "Ontario, Canada",
    period: "Sep 2024 – Apr 2028",
    description:
      "Three-year Ontario College Advanced Diploma focused on web development, databases, and cybersecurity. Coursework includes application security, SQL, operating systems, OOP, and C. Expected graduation April 2027. GPA 3.6+.",
    type: "education"
  },
  {
    title: "PentesterLab Recon Badge",
    org: "PentesterLab",
    location: "Credential ID PTLR2906",
    period: "2025",
    description:
      "Earned the Recon badge for completing offensive security exercises.",
    type: "certification"
  },
  {
    title: "ConHacks 2025 – 2nd Place",
    org: "ConHacks",
    location: "Waterloo, ON",
    period: "2025",
    description:
      "Placed 2nd for an AI lab report analyzer that combines OCR, OpenAI API analysis, and YouTube recommendations.",
    type: "award"
  }
];

export const projects = [
  {
    name: "Sistema VidaViva",
    description:
      "Desktop platform for patient, supplementation, and materials registration. Built for offline resilience and fast daily operations.",
    stack: ["Python", "Kivy", "Local storage"],
    link: "https://github.com/Pichara/Sistema-VidaViva",
    image: vidaViva
  },
  {
    name: "AutoHighlights",
    description:
      "Automated Twitch highlights pipeline that detects hype spikes, records clips, and streamlines review and upload.",
    stack: ["Python", "Playwright", "Selenium", "MoviePy"],
    link: "https://github.com/Pichara/AutoHighlights",
    image: autoHighlights
  },
  {
    name: "Gabaritech MYSQL",
    description:
      "Exam practice tracker that stores answers in MySQL and evaluates responses for study sessions.",
    stack: ["MySQL", "C++"],
    link: "https://github.com/Pichara/Gabaritech_MYSQL",
    image: gabaritech
  },
  {
    name: "Gabaritech TXT",
    description:
      "Offline-friendly version of the exam tracker using local text storage and instant feedback.",
    stack: ["C++", "Local TXT"],
    link: "https://github.com/Pichara/Gabaritech_TXT",
    image: gabaritech
  },
  {
    name: "OOP-Project (LAN Messaging)",
    description:
      "LAN-based messaging system demonstrating TCP/IP communication with a WPF desktop UI.",
    stack: ["C#", "WPF", "TCP/IP"],
    link: "https://github.com/Pichara/OOP-Project",
    image: lanMessaging
  },
  {
    name: "LockText",
    description:
      "Caesar cipher utility with encrypt, decrypt, and brute-force capabilities in a Kivy UI.",
    stack: ["Python", "Kivy"],
    link: "https://github.com/Pichara/LockText",
    image: lockText
  },
  {
    name: "Library System",
    description:
      "Data structures project implementing a library management system with linked lists, hash tables, and BSTs.",
    stack: ["C", "Data Structures"],
    link: "https://github.com/Pichara",
    image: librarySystem
  },
  {
    name: "ConHacks 2025 – AI Lab Report Analyzer",
    description:
      "Hackathon web app that analyzes lab report images and delivers structured HTML insights with OCR + AI.",
    stack: ["C#", "Blazor", "OpenAI"],
    link: "https://github.com/Pichara/ConHacks-2025",
    image: conhacks
  }
];
