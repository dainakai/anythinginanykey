"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// src/lib/prisma.ts
const edge_1 = require("@prisma/client/edge");
const extension_accelerate_1 = require("@prisma/extension-accelerate");
function createPrismaClient() {
    return new edge_1.PrismaClient().$extends((0, extension_accelerate_1.withAccelerate)());
}
// グローバルシングルトンをサポートしつつAccelerate対応
exports.prisma = global.prisma || createPrismaClient();
if (process.env.NODE_ENV !== 'production')
    global.prisma = exports.prisma;
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map