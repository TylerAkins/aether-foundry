#!/usr/bin/env node

import { hash } from "@node-rs/argon2";
import postgres from "postgres";

const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
  algorithm: 2,
};

const GLOBAL_ROLES = ["owner", "system_admin", "employee"];
const STATUSES = ["pending", "active", "suspended", "terminated"];

function parseArgs(argv) {
  const args = {
    globalRole: "employee",
    status: "pending",
    verified: false,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--company-email" && next) {
      args.companyEmail = next.trim().toLowerCase();
      index += 1;
    } else if (arg === "--personal-email" && next) {
      args.personalEmail = next.trim().toLowerCase();
      index += 1;
    } else if (arg === "--first-name" && next) {
      args.firstName = next.trim();
      index += 1;
    } else if (arg === "--middle-name" && next) {
      args.middleName = next.trim();
      index += 1;
    } else if (arg === "--last-name" && next) {
      args.lastName = next.trim();
      index += 1;
    } else if (arg === "--phone" && next) {
      args.phone = next.trim();
      index += 1;
    } else if (arg === "--github-url" && next) {
      args.githubUrl = next.trim();
      index += 1;
    } else if (arg === "--password" && next) {
      args.password = next;
      index += 1;
    } else if ((arg === "--global-role" || arg === "--role") && next) {
      args.globalRole = next;
      index += 1;
    } else if (arg === "--status" && next) {
      args.status = next;
      index += 1;
    } else if (arg === "--verified") {
      args.verified = true;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    }
  }

  return args;
}

function validateArgs(args) {
  if (!args.companyEmail || !args.companyEmail.includes("@")) {
    throw new Error("--company-email must be a valid email address.");
  }

  if (!args.personalEmail || !args.personalEmail.includes("@")) {
    throw new Error("--personal-email must be a valid email address.");
  }

  for (const key of ["firstName", "lastName", "phone", "githubUrl"]) {
    if (!args[key]) {
      throw new Error(`--${toKebabCase(key)} is required.`);
    }
  }

  const githubUrl = new URL(args.githubUrl);
  if (
    githubUrl.hostname !== "github.com" &&
    !githubUrl.hostname.endsWith(".github.com")
  ) {
    throw new Error("--github-url must be a GitHub URL.");
  }

  if (!args.password || args.password.length < 12) {
    throw new Error("--password must be at least 12 characters.");
  }

  if (!GLOBAL_ROLES.includes(args.globalRole)) {
    throw new Error("--global-role must be owner, system_admin, or employee.");
  }

  if (!STATUSES.includes(args.status)) {
    throw new Error(
      "--status must be pending, active, suspended, or terminated."
    );
  }

  if (!process.env.DATABASE_URL && !args.dryRun) {
    throw new Error("DATABASE_URL is required unless --dry-run is set.");
  }
}

function toKebabCase(value) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

const args = parseArgs(process.argv.slice(2));
validateArgs(args);

if (args.dryRun) {
  console.info("Dry run: employee account would be created.", {
    companyEmail: args.companyEmail,
    personalEmail: args.personalEmail,
    firstName: args.firstName,
    middleName: args.middleName ?? null,
    lastName: args.lastName,
    phone: args.phone,
    githubUrl: args.githubUrl,
    globalRole: args.globalRole,
    status: args.status,
    verified: args.verified,
  });
  process.exit(0);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  const passwordHash = await hash(args.password, ARGON2_OPTIONS);
  const [employee] = await sql`
    insert into employee_accounts (
      company_email,
      personal_email,
      first_name,
      middle_name,
      last_name,
      phone,
      github_url,
      password_hash,
      global_role,
      status,
      email_verified_at
    )
    values (
      ${args.companyEmail},
      ${args.personalEmail},
      ${args.firstName},
      ${args.middleName ?? null},
      ${args.lastName},
      ${args.phone},
      ${args.githubUrl},
      ${passwordHash},
      ${args.globalRole},
      ${args.status},
      ${args.verified ? new Date() : null}
    )
    on conflict (company_email) do nothing
    returning id, company_email, global_role, status, email_verified_at
  `;

  if (employee) {
    console.info("Employee account created.", {
      id: employee.id,
      companyEmail: employee.company_email,
      globalRole: employee.global_role,
      status: employee.status,
      verified: Boolean(employee.email_verified_at),
    });
  } else {
    const [existing] = await sql`
      select id, company_email, global_role, status, email_verified_at
      from employee_accounts
      where company_email = ${args.companyEmail}
      limit 1
    `;

    console.info("Employee account already exists.", {
      id: existing.id,
      companyEmail: existing.company_email,
      globalRole: existing.global_role,
      status: existing.status,
      verified: Boolean(existing.email_verified_at),
    });
  }
} finally {
  await sql.end();
}
