process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async () => {
    let result = await db.query(`
    INSERT INTO
    companies (code, name, description)
    VALUES ('test', 'Test Company', 'test description')
    RETURNING code, name, description`);
    testCompany = result.rows[0];
});

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
    await db.end();
});

describe("GET /companies", () => {
    test("Gets list of companies", async () => {
        const response = await request(app).get("/companies");

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({companies : [{
                code : testCompany.code,
                name : testCompany.name
            }]
        });
    });
});

describe("GET /companies/:code", () => {
    test("Gets company with code", async () => {
        const response = await request(app).get(`/companies/${testCompany.code}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({company : testCompany});
    });

    test("Responds with 404 if code is invalid", async () => {
        const response = await request(app).get("/companies/randomnonsense");

        expect(response.statusCode).toBe(404);
    });
})

describe("POST /companies", () => {
    test("Add company with given details", async () => {
        const response = await request(app)
                            .post(`/companies`)
                            .send({code : "test2",
                                name : "Test Company 2",
                                description : "grandiose description"});

        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({company : {
                code : "test2",
                name : "Test Company 2",
                description : "grandiose description"
            }
        });
    });
})

describe("PUT /companies/:code", () => {
    test("Edits company with code", async () => {
        const response = await request(app)
                            .put(`/companies/${testCompany.code}`)
                            .send({name : "Test Company 2",
                            description : "grandiose description"});

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({company : {
            code : "test",
            name : "Test Company 2",
            description : "grandiose description"
            }
        });
    });

    test("Responds with 404 if code is invalid", async () => {
        const response = await request(app)
                            .put(`/companies/typo`)
                            .send({name : "Test Company 2",
                            description : "grandiose description"});

        expect(response.statusCode).toBe(404);
    });
})

describe("DELETE /companies/:code", () => {
    test("Deletes company with code", async () => {
        const response = await request(app).delete(`/companies/${testCompany.code}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({message : "Deleted"});
    });

    test("Responds with 404 if code is invalid", async () => {
        const response = await request(app).delete(`/companies/uhoh`);

        expect(response.statusCode).toBe(404);
    });
})
