import express from 'npm:express@^4.18.2';
import authenticateUser from '../../middleware/authenticate.js';
import db from '../config/db.js';

const router = express.Router();


router.get('/summary', authenticateUser, async (req, res) => {
    const userId = req.user.id;
    let { month, year } = req.query;

    if (!month || !year) {
        const today = new Date();
        month = today.getMonth() + 1;
        year = today.getFullYear();
    }
    
    try {
        const [saldoResult] = await db.execute(
            `SELECT 
                SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) AS total_income,
                SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) AS total_expense
            FROM transactions
            WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?;`,
            [userId, month, year]
        );

        const [categoryBreakdown] = await db.execute(
            `SELECT 
                category, 
                SUM(amount) AS category_total
            FROM transactions
            WHERE user_id = ? AND type = 'Expense' AND MONTH(date) = ? AND YEAR(date) = ?
            GROUP BY category;`,
            [userId, month, year]
        );

        const totalIncome = parseFloat(saldoResult[0].total_income) || 0;
        const totalExpense = parseFloat(saldoResult[0].total_expense) || 0;
        
        const summary = {
            currentSaldo: totalIncome - totalExpense,
            total_income: totalIncome,
            total_expense: totalExpense,
            categoryBreakdown: categoryBreakdown
        };

        return res.status(200).json(summary);
        
    } catch (error) {
        console.error("Fehler beim Abrufen der Zusammenfassung:", error);
        return res.status(500).json({ message: "Interner Serverfehler beim Saldo." });
    }
});


router.post('/income', authenticateUser, async (req, res) => {
    const { amount, category, date, description } = req.body;
    const userId = req.user.id;

    const parsedAmount = parseFloat(amount);
    if (!amount || !category || !date || isNaN(new Date(date).getTime())) {
        return res.status(400).json({ message: "Fehlende oder ungültige Daten (Betrag, Kategorie, Datum)." });
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: "Der Betrag muss eine positive Zahl sein." });
    }

    try {
        await db.execute(
            `INSERT INTO transactions 
             (user_id, type, amount, category, date, description) 
             VALUES (?, 'Income', ?, ?, ?, ?)`,
            [userId, parsedAmount, category, date, description || null]
        );
        
        return res.status(201).json({ message: "Einnahme erfolgreich gespeichert." });
        
    } catch (error) {
        console.error("Datenbankfehler:", error);
        return res.status(500).json({ message: "Interner Serverfehler beim Speichern." });
    }
});


router.post('/expense', authenticateUser, async (req, res) => {
    const { amount, category, date, description } = req.body;
    const userId = req.user.id;

    const parsedAmount = parseFloat(amount);
    if (!amount || !category || !date || isNaN(new Date(date).getTime())) {
        return res.status(400).json({ message: "Fehlende oder ungültige Daten (Betrag, Kategorie, Datum)." });
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: "Der Betrag muss eine positive Zahl sein." });
    }

    try {
        await db.execute(
            `INSERT INTO transactions 
             (user_id, type, amount, category, date, description) 
             VALUES (?, 'Expense', ?, ?, ?, ?)`,
            [userId, parsedAmount, category, date, description || null]
        );
        
        return res.status(201).json({ message: "Ausgabe erfolgreich gespeichert." });
        
    } catch (error) {
        console.error("Datenbankfehler:", error);
        return res.status(500).json({ message: "Interner Serverfehler beim Speichern." });
    }
});


router.put('/transaction/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { amount, category, date, description } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!amount || !category || !date || isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: "Ungültige oder fehlende Daten für das Update." });
    }

    try {
        const [result] = await db.execute(
            `UPDATE transactions 
             SET amount = ?, category = ?, date = ?, description = ? 
             WHERE transaction_id = ? AND user_id = ?`,
            [parsedAmount, category, date, description || null, id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Transaktion nicht gefunden oder Zugriff verweigert." });
        }

        return res.status(200).json({ message: "Transaktion erfolgreich aktualisiert." });

    } catch (error) {
        console.error("Datenbankfehler beim Update:", error);
        return res.status(500).json({ message: "Interner Serverfehler beim Aktualisieren." });
    }
});


router.delete('/transaction/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const [result] = await db.execute(
            `DELETE FROM transactions 
             WHERE transaction_id = ? AND user_id = ?`,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Transaktion nicht gefunden oder Zugriff verweigert." });
        }

        return res.status(200).json({ message: "Transaktion erfolgreich gelöscht." });

    } catch (error) {
        console.error("Datenbankfehler beim Löschen:", error);
        return res.status(500).json({ message: "Interner Serverfehler beim Löschen." });
    }
});


router.get('/goals', authenticateUser, async (req, res) => {
    console.log('GET /goals Route aufgerufen');
    const userId = req.user.id;

    try {
        const [goals] = await db.execute(
            `SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );

        console.log(`${goals.length} Ziele gefunden für User ${userId}`);
        return res.status(200).json({ goals: goals });

    } catch (error) {
        console.error("Datenbankfehler beim Abrufen der Ziele:", error);
        return res.status(500).json({ message: "Interner Serverfehler." });
    }
});


router.post('/goal', authenticateUser, async (req, res) => {
    const userId = req.user.id;
    const { name, target_amount, start_date, end_date } = req.body;
    
    const target = parseFloat(target_amount);
    if (!name || !target || target <= 0 || isNaN(new Date(end_date).getTime())) {
        return res.status(400).json({ message: "Ungültige oder fehlende Zieldaten." });
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
        
        return res.status(201).json({ 
            message: "Sparziel erfolgreich angelegt.",
            goalId: goalId,
            reminder: {
                amount: amountToSavePerMonth.toFixed(2),
                months: monthsRemaining
            }
        });

    } catch (error) {
        console.error("Datenbankfehler beim Ziel anlegen:", error);
        return res.status(500).json({ message: "Interner Serverfehler." });
    }
});


router.get('/goal/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const [goalResult] = await db.execute(
            `SELECT * FROM goals WHERE goal_id = ? AND user_id = ?`,
            [id, userId]
        );

        if (goalResult.length === 0) {
            return res.status(404).json({ message: "Sparziel nicht gefunden oder Zugriff verweigert." });
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
        if (progressPercent >= 50 && progressPercent < 100) {
            badge = "50%-Meilenstein erreicht!";
        } else if (progressPercent >= 100) {
            badge = "Ziel erreicht!";
        }

        return res.status(200).json({
            goal: goal,
            progress: {
                percent: progressPercent,
                badge: badge
            },
            reminder: {
                amount: amountToSavePerMonth.toFixed(2),
                months: monthsRemaining
            }
        });

    } catch (error) {
        console.error("Datenbankfehler beim Abrufen des Ziels:", error);
        return res.status(500).json({ message: "Interner Serverfehler." });
    }
});


router.put('/goal/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, current_savings, target_amount } = req.body;

    const parsedSavings = parseFloat(current_savings);
    const parsedTarget = parseFloat(target_amount);
    
    if (!name && isNaN(parsedSavings) && isNaN(parsedTarget)) {
        return res.status(400).json({ message: "Keine gültigen Felder für das Update bereitgestellt." });
    }
    if ((!isNaN(parsedSavings) && parsedSavings < 0) || (!isNaN(parsedTarget) && parsedTarget <= 0)) {
        return res.status(400).json({ message: "Sparbeträge und Zielbeträge müssen positiv sein." });
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
        return res.status(400).json({ message: "Keine Felder zum Aktualisieren gefunden." });
    }

    try {
        const updateQuery = `UPDATE goals SET ${updateFields.join(', ')} WHERE goal_id = ? AND user_id = ?`;
        queryParams.push(id, userId);
        
        const [result] = await db.execute(updateQuery, queryParams);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Sparziel nicht gefunden oder Zugriff verweigert." });
        }

        return res.status(200).json({ message: "Sparziel erfolgreich aktualisiert." });

    } catch (error) {
        console.error("Datenbankfehler beim Aktualisieren des Ziels:", error);
        return res.status(500).json({ message: "Interner Serverfehler beim Aktualisieren." });
    }
});

export default router;
