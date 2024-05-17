process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

beforeEach(async () => {
    let result = await db.query(`
    INSERT INTO
    companies (code, name, description)
    VALUES ('test', 'Test Company', 'test description')
    RETURNING code, name, description`);
    testCompany = result.rows[0];

    let result2 = await db.query(`
    INSERT INTO
    invoices (comp_code, amt)
    VALUES ('test', 123)
    RETURNING id, comp_code, amt, paid, add_date, paid_date`);
    testInvoice = result2.rows[0];
});

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
});

afterAll(async () => {
    await db.end();
});

describe("GET /invoices", () => {
    test("Gets list of invoices", async () => {
        const response = await request(app).get("/invoices");

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({invoices : [{
                id : testInvoice.id,
                comp_code : testInvoice.comp_code
            }]
        });
    });
});

describe("GET /invoices/:id", () => {
    test("Gets invoice with id", async () => {
        const response = await request(app).get(`/invoices/${testInvoice.id}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({invoice : {
                id : testInvoice.id,
                amt : testInvoice.amt,
                paid : testInvoice.paid,
                add_date : testInvoice.add_date.toISOString(),
                paid_date : testInvoice.paid_date,
                company : {
                    code : testCompany.code,
                    name : testCompany.name,
                    description : testCompany.description
                }
            }
        });
    });

    test("Responds with 404 if code is invalid", async () => {
        const response = await request(app).get("/invoices/2048");

        expect(response.statusCode).toBe(404);
    });
})

describe("POST /invoices", () => {
    test("Add invoice with given details", async () => {
        const response = await request(app)
                            .post(`/invoices`)
                            .send({comp_code : "test",
                                amt : 1729});

        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({invoice : {
                id : testInvoice.id + 1,
                comp_code : "test",
                amt : 1729,
                paid : false,
                add_date : testInvoice.add_date.toISOString(),
                paid_date : null,
            }
        });
    });
})

describe("PUT /companies/:id", () => {
    test("Edits invoice with id", async () => {
        const response = await request(app)
                            .put(`/invoices/${testInvoice.id}`)
                            .send({amt : 45});

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({invoice : {
                id : testInvoice.id,
                comp_code : testInvoice.comp_code,
                amt : 45,
                paid : testInvoice.paid,
                add_date : testInvoice.add_date.toISOString(),
                paid_date : testInvoice.paid_date,
            }
        });
    });

    test("Responds with 404 if id is invalid", async () => {
        const response = await request(app)
                            .put(`/invoices/9999`)
                            .send({amt : 45});

        expect(response.statusCode).toBe(404);
    });
})

describe("DELETE /invoices/:id", () => {
    test("Deletes invoice with id", async () => {
        const response = await request(app).delete(`/invoices/${testInvoice.id}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({message : "Deleted"});
    });

    test("Responds with 404 if id is invalid", async () => {
        const response = await request(app).delete(`/invoices/4321`);

        expect(response.statusCode).toBe(404);
    });
})
