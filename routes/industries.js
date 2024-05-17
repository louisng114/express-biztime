const express = require("express");
const ExpressError = require("../expressError");
const router = new express.Router();

const slugify = require("slugify");

const db = require("../db");

/** GET: Return all industries */

router.get("/", async (req, res, next) => {
    try{
        const results = await db.query(`SELECT code,industry FROM industries`);

        return res.json({industries : results.rows});
    } catch (err) {
        return next(err);
    }
});

/** GET: Return industry with matching code */

router.get("/:code", async (req, res, next) => {
    try{
        const results = await db.query(
            `SELECT code,industry,name AS comp
            FROM industries
            LEFT JOIN companies-industries
            ON industries.code = companies-industries.comp_code
            LEFT JOIN industries
            ON companies-industries.industries_code = companies.code
            WHERE industries.code=$1`,
            [req.params.code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`Company not found`, 404);
        }

        const { code, industry } = results.rows[0];
        const comps = results.rows.map(row => row.comp);

        return res.json({company : {code, industry, comps}});
    } catch (err) {
        return next(err);
    }
});

/** POST: Add industry */

router.post("/", async (req, res, next) => {
    try{
        const { code, industry } = req.body;

        const result = await db.query(
            `INSERT INTO industries (code, industry)
            VALUES($1, $2)
            RETURNING code, industry`,
            [slugify(code, {
                replacement: '-',
                lower: true,
                strict: true,
            }), industry]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`Unable to add company`, 400);
        }

        return res.status(201).json({company : result.rows[0]});
    } catch (err) {
        return next(err);
    }
});

/** POST: Add industry to company */

router.post("/companies", async (req, res, next) => {
    try{
        const { comp_code, industry_code } = req.body;

        const result = await db.query(
            `INSERT INTO companies-industries (comp_code, industry_code)
            VALUES($1, $2)
            RETURNING comp_code, industry_code`,
            [comp_code, industry_code]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`Unable to add company`, 400);
        }

        return res.status(201).json({company : result.rows[0]});
    } catch (err) {
        return next(err);
    }
});


module.exports = router;
