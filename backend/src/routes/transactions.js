import { Router } from 'https://deno.land/x/oak@v16.0.0/mod.ts';
import authenticateUser from '../../middleware/authenticate.js';
import db from '../config/db.js';

const router = new Router();

// GET /api/transactions/summary
router.get('/api/transactions/summary', authenticateUser, async (ctx) => {
    const userId = ctx.state.user.id;
    const urlParams = ctx.request.url.searchParams;
    let month = urlParams.get('month');
    let year = urlParams.get('year');

    if (!month || !year) {
        const today = new Date();
        month = String(today.getMonth() + 1);
        year = String(today.getFullYear());
    }
    
    try {
        const [saldoResult] = await db.execute(
            `SELECT 
                SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) AS total_income,
                SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) AS total_expense
            FROM transactions
            WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?;`,
            [userId, parseInt(month), parseInt(year)]
        );

        const [categoryBreakdown] = await db.execute(
            `SELECT 
                category, 
                SUM(amount) AS category_total
            FROM transactions
            WHERE user_id = ? AND type = 'Expense' AND MONTH(date) = ? AND YEAR(date) = ?
            GROUP BY category;`,
            [userId, parseInt(month), parseInt(year)]
        );

        const totalIncome = parseFloat(saldoResult[0].total_income) || 0;
        const totalExpense = parseFloat(saldoResult[0].total_expense) || 0;
        
        const summary = {
            currentSaldo: totalIncome - totalExpense,
            total_income: totalIncome,
            total_expense: totalExpense,
            categoryBreakdown: categoryBreakdown
        };

        ctx.response.status = 200;
        ctx.response.body = summary;
        
    } catch (error) {
        console.error("Fehler beim Abrufen der Zusammenfassung:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Interner Serverfehler beim Saldo." };
    }
});

// POST /api/transactions/income
router.post('/api/transactions/income', authenticateUser, async (ctx) => {
    const body = ctx.state.body || {};
    const { amount, category, date, description } = body;
    const userId = ctx.state.user.id;

    const parsedAmount = parseFloat(amount);
    if (!amount || !category || !date || isNaN(new Date(date).getTime())) {
        ctx.response.status = 400;
        ctx.response.body = { message: "Fehlende oder ungültige Daten (Betrag, Kategorie, Datum)." };
        return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        ctx.response.status = 400;
        ctx.response.body = { message: "Der Betrag muss eine positive Zahl sein." };
        return;
    }

    try {
        await db.execute(
            `INSERT INTO transactions 
             (user_id, type, amount, category, date, description) 
             VALUES (?, 'Income', ?, ?, ?, ?)`,
            [userId, parsedAmount, category, date, description || null]
        );
        
        ctx.response.status = 201;
        ctx.response.body = { message: "Einnahme erfolgreich gespeichert." };
        
    } catch (error) {
        console.error("Datenbankfehler:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Interner Serverfehler beim Speichern." };
    }
});

// POST /api/transactions/expense
router.post('/api/transactions/expense', authenticateUser, async (ctx) => {
    const body = ctx.state.body || {};
    const { amount, category, date, description } = body;
    const userId = ctx.state.user.id;

    const parsedAmount = parseFloat(amount);
    if (!amount || !category || !date || isNaN(new Date(date).getTime())) {
        ctx.response.status = 400;
        ctx.response.body = { message: "Fehlende oder ungültige Daten (Betrag, Kategorie, Datum)." };
        return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        ctx.response.status = 400;
        ctx.response.body = { message: "Der Betrag muss eine positive Zahl sein." };
        return;
    }

    try {
        await db.execute(
            `INSERT INTO transactions 
             (user_id, type, amount, category, date, description) 
             VALUES (?, 'Expense', ?, ?, ?, ?)`,
            [userId, parsedAmount, category, date, description || null]
        );
        
        ctx.response.status = 201;
        ctx.response.body = { message: "Ausgabe erfolgreich gespeichert." };
        
    } catch (error) {
        console.error("Datenbankfehler:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Interner Serverfehler beim Speichern." };
    }
});

// PUT /api/transactions/transaction/:id
router.put('/api/transactions/transaction/:id', authenticateUser, async (ctx) => {
    const id = ctx.params.id;
    const userId = ctx.state.user.id;
    const body = ctx.state.body || {};
    const { amount, category, date, description } = body;

    const parsedAmount = parseFloat(amount);
    if (!amount || !category || !date || isNaN(parsedAmount) || parsedAmount <= 0) {
        ctx.response.status = 400;
        ctx.response.body = { message: "Ungültige oder fehlende Daten für das Update." };
        return;
    }

    try {
        const [result] = await db.execute(
            `UPDATE transactions 
             SET amount = ?, category = ?, date = ?, description = ? 
             WHERE transaction_id = ? AND user_id = ?`,
            [parsedAmount, category, date, description || null, id, userId]
        );

        if (result.affectedRows === 0) {
            ctx.response.status = 404;
            ctx.response.body = { message: "Transaktion nicht gefunden oder Zugriff verweigert." };
            return;
        }

        ctx.response.status = 200;
        ctx.response.body = { message: "Transaktion erfolgreich aktualisiert." };

    } catch (error) {
        console.error("Datenbankfehler beim Update:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Interner Serverfehler beim Aktualisieren." };
    }
});

// DELETE /api/transactions/transaction/:id
router.delete('/api/transactions/transaction/:id', authenticateUser, async (ctx) => {
    const id = ctx.params.id;
    const userId = ctx.state.user.id;

    try {
        const [result] = await db.execute(
            `DELETE FROM transactions 
             WHERE transaction_id = ? AND user_id = ?`,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            ctx.response.status = 404;
            ctx.response.body = { message: "Transaktion nicht gefunden oder Zugriff verweigert." };
            return;
        }

        ctx.response.status = 200;
        ctx.response.body = { message: "Transaktion erfolgreich gelöscht." };

    } catch (error) {
        console.error("Datenbankfehler beim Löschen:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Interner Serverfehler beim Löschen." };
    }
});

// GET /api/transactions/goals
router.get('/api/transactions/goals', authenticateUser, async (ctx) => {
    const userId = ctx.state.user.id;

    try {
        const [goals] = await db.execute(
            `SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );

        ctx.response.status = 200;
        ctx.response.body = { goals: goals };

    } catch (error) {
        console.error("Datenbankfehler beim Abrufen der Ziele:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Interner Serverfehler." };
    }
});

// POST /api/transactions/goal
router.post('/api/transactions/goal', authenticateUser, async (ctx) => {
    const userId = ctx.state.user.id;
    const body = ctx.state.body || {};
    const { name, target_amount, start_date, end_date } = body;
    
    const target = parseFloat(target_amount);
    if (!name || !target || target <= 0 || isNaN(new Date(end_date).getTime())) {
        ctx.response.status = 400;
        ctx.response.body = { message: "Ungültige oder fehlende Zieldaten." };
        return;
    }

    try {
        const [result] = await db.execute(
            `INSERT INTO goals 
             (user_id, name, target_amount, current_savings, start_date, end_date) 
             VALUES (?, ?, ?, 0.00, ?, ?)`,
            [userId, name, target, start_date || new Date(), end_date]
        );

        const goalId = result.insertId;
        const today = new Date();
        const endDate = new Date(end_date);
        
        let monthsRemaining = (endDate.getFullYear() - today.getFullYear()) * 12;
        monthsRemaining -= today.getMonth();
        monthsRemaining += endDate.getMonth();
        monthsRemaining = Math.max(1, monthsRemaining);

        const amountToSavePerMonth = (target - 0) / monthsRemaining;
        
        ctx.response.status = 201;
        ctx.response.body = { 
            message: "Sparziel erfolgreich angelegt.",
            goalId: goalId,
            reminder: {
                amount: amountToSavePerMonth.toFixed(2),
                months: monthsRemaining
            }
        };

    } catch (error) {
        console.error("Datenbankfehler beim Ziel anlegen:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Interner Serverfehler." };
    }
});

// GET /api/transactions/goal/:id
router.get('/api/transactions/goal/:id', authenticateUser, async (ctx) => {
    const id = ctx.params.id;
    const userId = ctx.state.user.id;

    try {
        const [goalResult] = await db.execute(
            `SELECT * FROM goals WHERE goal_id = ? AND user_id = ?`,
            [id, userId]
        );

        if (goalResult.length === 0) {
            ctx.response.status = 404;
            ctx.response.body = { message: "Sparziel nicht gefunden oder Zugriff verweigert." };
            return;
        }

        const goal = goalResult[0];
        const target = parseFloat(goal.target_amount);
        const saved = parseFloat(goal.current_savings);
        const endDate = new Date(goal.end_date);
        const today = new Date();

        const progressPercent = ((saved / target) * 100).toFixed(2);
        
        let monthsRemaining = (endDate.getFullYear() - today.getFullYear()) * 12;
        monthsRemaining -= today.getMonth();
        monthsRemaining += endDate.getMonth();
        monthsRemaining = Math.max(1, monthsRemaining);

        const neededToSave = Math.max(0, target - saved);
        const amountToSavePerMonth = neededToSave / monthsRemaining;

        let badge = null;
        if (parseFloat(progressPercent) >= 50 && parseFloat(progressPercent) < 100) {
            badge = "50%-Meilenstein erreicht!";
        } else if (parseFloat(progressPercent) >= 100) {
            badge = "Ziel erreicht!";
        }

        ctx.response.status = 200;
        ctx.response.body = {
            goal: goal,
            progress: {
                percent: progressPercent,
                badge: badge
            },
            reminder: {
                amount: amountToSavePerMonth.toFixed(2),
                months: monthsRemaining
            }
        };

    } catch (error) {
        console.error("Datenbankfehler beim Abrufen des Ziels:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Interner Serverfehler." };
    }
});

// PUT /api/transactions/goal/:id
router.put('/api/transactions/goal/:id', authenticateUser, async (ctx) => {
    const id = ctx.params.id;
    const userId = ctx.state.user.id;
    const body = ctx.state.body || {};
    const { name, current_savings, target_amount } = body;

    const parsedSavings = parseFloat(current_savings);
    const parsedTarget = parseFloat(target_amount);
    
    if (!name && isNaN(parsedSavings) && isNaN(parsedTarget)) {
        ctx.response.status = 400;
        ctx.response.body = { message: "Keine gültigen Felder für das Update bereitgestellt." };
        return;
    }
    if ((!isNaN(parsedSavings) && parsedSavings < 0) || (!isNaN(parsedTarget) && parsedTarget <= 0)) {
        ctx.response.status = 400;
        ctx.response.body = { message: "Sparbeträge und Zielbeträge müssen positiv sein." };
        return;
    }

    let updateFields = [];
    let queryParams = [];

    if (name) {
        updateFields.push('name = ?');
        queryParams.push(name);
    }
    if (!isNaN(parsedSavings)) {
        updateFields.push('current_savings = ?');
        queryParams.push(parsedSavings);
    }
    if (!isNaN(parsedTarget)) {
        updateFields.push('target_amount = ?');
        queryParams.push(parsedTarget);
    }

    if (updateFields.length === 0) {
        ctx.response.status = 400;
        ctx.response.body = { message: "Keine Felder zum Aktualisieren gefunden." };
        return;
    }

    try {
        const updateQuery = `UPDATE goals SET ${updateFields.join(', ')} WHERE goal_id = ? AND user_id = ?`;
        queryParams.push(id, userId);
        
        const [result] = await db.execute(updateQuery, queryParams);

        if (result.affectedRows === 0) {
            ctx.response.status = 404;
            ctx.response.body = { message: "Sparziel nicht gefunden oder Zugriff verweigert." };
            return;
        }

        ctx.response.status = 200;
        ctx.response.body = { message: "Sparziel erfolgreich aktualisiert." };

    } catch (error) {
        console.error("Datenbankfehler beim Aktualisieren des Ziels:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Interner Serverfehler beim Aktualisieren." };
    }
});

// PUT /api/transactions/goal/:id/add - Betrag zum Sparziel hinzufügen
router.put('/api/transactions/goal/:id/add', authenticateUser, async (ctx) => {
    const id = ctx.params.id;
    const userId = ctx.state.user.id;
    const body = ctx.state.body || {};
    const { amount } = body;

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        ctx.response.status = 400;
        ctx.response.body = { message: "Ungültiger Betrag. Der Betrag muss eine positive Zahl sein." };
        return;
    }

    try {
        const [goalCheck] = await db.execute(
            `SELECT current_savings, target_amount FROM goals WHERE goal_id = ? AND user_id = ?`,
            [id, userId]
        );

        if (goalCheck.length === 0) {
            ctx.response.status = 404;
            ctx.response.body = { message: "Sparziel nicht gefunden oder Zugriff verweigert." };
            return;
        }

        const currentSavings = parseFloat(goalCheck[0].current_savings);
        const targetAmount = parseFloat(goalCheck[0].target_amount);
        const newSavings = currentSavings + parsedAmount;

        const [result] = await db.execute(
            `UPDATE goals SET current_savings = ? WHERE goal_id = ? AND user_id = ?`,
            [newSavings, id, userId]
        );

        if (result.affectedRows === 0) {
            ctx.response.status = 500;
            ctx.response.body = { message: "Fehler beim Aktualisieren des Sparziels." };
            return;
        }

        const newProgress = ((newSavings / targetAmount) * 100).toFixed(2);
        let badge = null;
        if (parseFloat(newProgress) >= 50 && parseFloat(newProgress) < 100) {
            badge = "50%-Meilenstein erreicht!";
        } else if (parseFloat(newProgress) >= 100) {
            badge = "Ziel erreicht!";
        }

        ctx.response.status = 200;
        ctx.response.body = { 
            message: `Betrag von ${parsedAmount.toFixed(2)} € erfolgreich hinzugefügt.`,
            new_savings: newSavings,
            progress_percent: newProgress,
            badge: badge
        };

    } catch (error) {
        console.error("Datenbankfehler beim Hinzufügen des Betrags:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Interner Serverfehler beim Hinzufügen des Betrags." };
    }
});

// PUT /api/transactions/goal/:id/remove - Betrag vom Sparziel entfernen
router.put('/api/transactions/goal/:id/remove', authenticateUser, async (ctx) => {
    const id = ctx.params.id;
    const userId = ctx.state.user.id;
    const body = ctx.state.body || {};
    const { amount } = body;

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        ctx.response.status = 400;
        ctx.response.body = { message: "Ungültiger Betrag. Der Betrag muss eine positive Zahl sein." };
        return;
    }

    try {
        const [goalCheck] = await db.execute(
            `SELECT current_savings, target_amount FROM goals WHERE goal_id = ? AND user_id = ?`,
            [id, userId]
        );

        if (goalCheck.length === 0) {
            ctx.response.status = 404;
            ctx.response.body = { message: "Sparziel nicht gefunden oder Zugriff verweigert." };
            return;
        }

        const currentSavings = parseFloat(goalCheck[0].current_savings);
        const targetAmount = parseFloat(goalCheck[0].target_amount);
        
        if (currentSavings < parsedAmount) {
            ctx.response.status = 400;
            ctx.response.body = { 
                message: `Nicht genug gespart. Aktueller Stand: ${currentSavings.toFixed(2)} €. Du kannst maximal ${currentSavings.toFixed(2)} € entfernen.` 
            };
            return;
        }

        const newSavings = Math.max(0, currentSavings - parsedAmount);

        const [result] = await db.execute(
            `UPDATE goals SET current_savings = ? WHERE goal_id = ? AND user_id = ?`,
            [newSavings, id, userId]
        );

        if (result.affectedRows === 0) {
            ctx.response.status = 500;
            ctx.response.body = { message: "Fehler beim Aktualisieren des Sparziels." };
            return;
        }

        const newProgress = ((newSavings / targetAmount) * 100).toFixed(2);
        let badge = null;
        if (parseFloat(newProgress) >= 50 && parseFloat(newProgress) < 100) {
            badge = "50%-Meilenstein erreicht!";
        } else if (parseFloat(newProgress) >= 100) {
            badge = "Ziel erreicht!";
        }

        ctx.response.status = 200;
        ctx.response.body = { 
            message: `Betrag von ${parsedAmount.toFixed(2)} € erfolgreich entfernt.`,
            new_savings: newSavings,
            progress_percent: newProgress,
            badge: badge
        };

    } catch (error) {
        console.error("Datenbankfehler beim Entfernen des Betrags:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Interner Serverfehler beim Entfernen des Betrags." };
    }
});

// DELETE /api/transactions/goal/:id
router.delete('/api/transactions/goal/:id', authenticateUser, async (ctx) => {
    const id = ctx.params.id;
    const userId = ctx.state.user.id;

    try {
        const [result] = await db.execute(
            `DELETE FROM goals 
             WHERE goal_id = ? AND user_id = ?`,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            ctx.response.status = 404;
            ctx.response.body = { message: "Sparziel nicht gefunden oder Zugriff verweigert." };
            return;
        }

        ctx.response.status = 200;
        ctx.response.body = { message: "Sparziel erfolgreich gelöscht." };

    } catch (error) {
        console.error("Datenbankfehler beim Löschen des Ziels:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: "Interner Serverfehler beim Löschen." };
    }
});

export default router;
