"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teams = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// User schema
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
    name: (0, pg_core_1.text)("name").notNull(),
    email: (0, pg_core_1.text)("email").notNull().unique(),
    avatarUrl: (0, pg_core_1.text)("avatar_url"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
    authId: (0, pg_core_1.text)("auth_id").unique(), // For Supabase Auth integration
});
// Teams schema
exports.teams = (0, pg_core_1.pgTable)("teams", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
