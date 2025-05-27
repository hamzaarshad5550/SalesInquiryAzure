"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var fs = require("fs");
var path = require("path");
function runMigrations() {
    return __awaiter(this, void 0, void 0, function () {
        var client, executedMigrations, executedMigrationNames, migrationsDir, migrationFiles, _i, migrationFiles_1, file, migrationPath, migrationSQL, error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, index_1.pool.connect()];
                case 1:
                    client = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 17, 18, 19]);
                    // Create migrations table if it doesn't exist
                    return [4 /*yield*/, client.query("\n      CREATE TABLE IF NOT EXISTS migrations (\n        id SERIAL PRIMARY KEY,\n        name TEXT NOT NULL,\n        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n      );\n    ")];
                case 3:
                    // Create migrations table if it doesn't exist
                    _a.sent();
                    return [4 /*yield*/, client.query('SELECT name FROM migrations')];
                case 4:
                    executedMigrations = (_a.sent()).rows;
                    executedMigrationNames = new Set(executedMigrations.map(function (m) { return m.name; }));
                    migrationsDir = path.join(__dirname, 'migrations');
                    migrationFiles = fs.readdirSync(migrationsDir)
                        .filter(function (f) { return f.endsWith('.sql'); })
                        .sort();
                    _i = 0, migrationFiles_1 = migrationFiles;
                    _a.label = 5;
                case 5:
                    if (!(_i < migrationFiles_1.length)) return [3 /*break*/, 16];
                    file = migrationFiles_1[_i];
                    if (!!executedMigrationNames.has(file)) return [3 /*break*/, 14];
                    console.log("Executing migration: ".concat(file));
                    migrationPath = path.join(migrationsDir, file);
                    migrationSQL = fs.readFileSync(migrationPath, 'utf8');
                    // Start transaction
                    return [4 /*yield*/, client.query('BEGIN')];
                case 6:
                    // Start transaction
                    _a.sent();
                    _a.label = 7;
                case 7:
                    _a.trys.push([7, 11, , 13]);
                    // Execute migration
                    return [4 /*yield*/, client.query(migrationSQL)];
                case 8:
                    // Execute migration
                    _a.sent();
                    // Record migration
                    return [4 /*yield*/, client.query('INSERT INTO migrations (name) VALUES ($1)', [file])];
                case 9:
                    // Record migration
                    _a.sent();
                    // Commit transaction
                    return [4 /*yield*/, client.query('COMMIT')];
                case 10:
                    // Commit transaction
                    _a.sent();
                    console.log("\u2705 Migration ".concat(file, " completed successfully"));
                    return [3 /*break*/, 13];
                case 11:
                    error_1 = _a.sent();
                    // Rollback transaction on error
                    return [4 /*yield*/, client.query('ROLLBACK')];
                case 12:
                    // Rollback transaction on error
                    _a.sent();
                    console.error("\u274C Migration ".concat(file, " failed:"), error_1);
                    throw error_1;
                case 13: return [3 /*break*/, 15];
                case 14:
                    console.log("Skipping already executed migration: ".concat(file));
                    _a.label = 15;
                case 15:
                    _i++;
                    return [3 /*break*/, 5];
                case 16:
                    console.log('All migrations completed successfully!');
                    return [3 /*break*/, 19];
                case 17:
                    error_2 = _a.sent();
                    console.error('Migration failed:', error_2);
                    throw error_2;
                case 18:
                    client.release();
                    return [7 /*endfinally*/];
                case 19: return [2 /*return*/];
            }
        });
    });
}
// Run migrations
runMigrations()
    .then(function () {
    console.log('Migration process completed');
    process.exit(0);
})
    .catch(function (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
});
