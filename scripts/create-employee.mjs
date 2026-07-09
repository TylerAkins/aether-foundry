#!/usr/bin/env node

import { hash } from "@node-rs/argon2";
import postgres from "postgres";

const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
  algorithm: 2,
};

function parseArgs(argv) {
  const args = {
    role: "employee",
    status: "active",
    verified: false,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--email" && next) {
      args.email = next.trim().toLowerCase();
      index += 1;
    } else if (arg === "--password" && next) {
      args.password = next;
      index += 1;
    } else if (arg === "--role" && next) {
      args.role = next;
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
  if (!args.email || !args.email.includes("@")) {
    throw new Error("--email must be a valid email address.");
  }

  if (!args.password || args.password.length < 12) {
    throw new Error("--password must be at least 12 characters.");
  }

  if (!["owner", "system_admin", "employee"].includes(args.role)) {
    throw new Error("--role must be owner, system_admin, or employee.");
  }

  if (!["active", "disabled"].includes(args.status)) {
    throw new Error("--status must be active or disabled.");
  }

  if (!process.env.DATABASE_URL && !args.dryRun) {
    throw new Error("DATABASE_URL is required unless --dry-run is set.");
  }
}

const args = parseArgs(process.argv.slice(2));
validateArgs(args);

if (args.dryRun) {
  console.info("Dry run: employee account would be created.", {
    email: args.email,
    role: args.role,
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
      email,
      password_hash,
      role,
      status,
      email_verified_at
    )
    values (
      ${args.email},
      ${passwordHash},
      ${args.role},
      ${args.status},
      ${args.verified ? new Date() : null}
    )
    returning id, email, role, status, email_verified_at
  `;

  console.info("Employee account created.", {
    id: employee.id,
    email: employee.email,
    role: employee.role,
    status: employee.status,
    verified: Boolean(employee.email_verified_at),
  });
} finally {
  await sql.end();
}
