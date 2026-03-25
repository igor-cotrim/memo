import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Express } from "express";

import { createTestApp } from "../helpers/setup";

describe("API Integration Tests", () => {
  let app: Express;
  let cleanup: () => void;
  let accessToken: string;
  let deckId: string;
  let cardId: string;

  beforeAll(() => {
    const testApp = createTestApp();
    app = testApp.app;
    cleanup = testApp.cleanup;
  });

  afterAll(() => cleanup());

  // ─── Health Check ──────────────────────────────────────────────────────────

  describe("GET /health", () => {
    it("should return ok", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });

  // ─── Auth ─────────────────────────────────────────────────────────────────

  describe("Auth", () => {
    it("POST /auth/register should create user", async () => {
      const res = await request(app).post("/auth/register").send({
        email: "test@example.com",
        name: "Test User",
        password: "SecurePass123!",
      });
      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe("test@example.com");
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it("POST /auth/register should fail on duplicate email", async () => {
      const res = await request(app).post("/auth/register").send({
        email: "test@example.com",
        name: "Another",
        password: "Pass123!",
      });
      expect(res.status).toBe(409);
    });

    it("POST /auth/login should return token", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "test@example.com", password: "SecurePass123!" });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      accessToken = res.body.accessToken;
    });

    it("POST /auth/login should fail with wrong password", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "test@example.com", password: "WrongPassword" });
      expect(res.status).toBe(401);
    });

    it("protected routes should reject without token", async () => {
      const res = await request(app).get("/decks");
      expect(res.status).toBe(401);
    });
  });

  // ─── Decks ────────────────────────────────────────────────────────────────

  describe("Decks", () => {
    it("POST /decks should create a deck", async () => {
      const res = await request(app)
        .post("/decks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Spanish",
          description: "Learn Spanish",
          color: "#e74c3c",
        });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Spanish");
      deckId = res.body.id;
    });

    it("GET /decks should list user decks", async () => {
      const res = await request(app)
        .get("/decks")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("GET /decks/:id should return deck", async () => {
      const res = await request(app)
        .get(`/decks/${deckId}`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Spanish");
    });

    it("PUT /decks/:id should update deck", async () => {
      const res = await request(app)
        .put(`/decks/${deckId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Español" });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Español");
    });
  });

  // ─── Cards ────────────────────────────────────────────────────────────────

  describe("Cards", () => {
    it("POST /decks/:deckId/cards should create a card", async () => {
      const res = await request(app)
        .post(`/decks/${deckId}/cards`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ front: "Hello", back: "Hola", notes: "Greeting" });
      expect(res.status).toBe(201);
      expect(res.body.front).toBe("Hello");
      expect(res.body.state).toBe(0);
      cardId = res.body.id;
    });

    it("GET /decks/:deckId/cards should list cards", async () => {
      const res = await request(app)
        .get(`/decks/${deckId}/cards`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("PUT /decks/:deckId/cards/:cardId should update card", async () => {
      const res = await request(app)
        .put(`/decks/${deckId}/cards/${cardId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ front: "Hi", back: "Hola" });
      expect(res.status).toBe(200);
      expect(res.body.front).toBe("Hi");
    });
  });

  // ─── Review ───────────────────────────────────────────────────────────────

  describe("Review", () => {
    it("GET /review/:deckId should return due cards", async () => {
      const res = await request(app)
        .get(`/review/${deckId}`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.totalDue).toBeGreaterThanOrEqual(1);
    });

    it("POST /review should submit review and update card", async () => {
      const res = await request(app)
        .post("/review")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ cardId, quality: 4 });
      expect(res.status).toBe(200);
      expect(res.body.reps).toBe(1);
      expect(res.body.state).toBe(2);
    });
  });

  // ─── Stats ────────────────────────────────────────────────────────────────

  describe("Stats", () => {
    it("GET /stats should return review statistics", async () => {
      const res = await request(app)
        .get("/stats")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("last7Days");
      expect(res.body).toHaveProperty("last30Days");
      expect(res.body).toHaveProperty("deckAccuracies");
      expect(res.body).toHaveProperty("currentStreak");
    });
  });

  // ─── Deck Delete ──────────────────────────────────────────────────────────

  describe("Cleanup", () => {
    it("DELETE /decks/:id should delete deck and cascade cards", async () => {
      const res = await request(app)
        .delete(`/decks/${deckId}`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(204);

      const listRes = await request(app)
        .get("/decks")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(listRes.body).toHaveLength(0);
    });
  });
});
