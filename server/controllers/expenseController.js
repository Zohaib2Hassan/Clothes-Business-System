import Expense from '../models/Expense.js';

// @desc    Get all expenses for the logged-in user
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    const { category, search, startDate, endDate } = req.query;
    const query = { user: req.user._id };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query).sort({ date: -1 });

    // Calculate summary stats
    const allExpenses = await Expense.find({ user: req.user._id });
    const totalAmount = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const categoryBreakdown = {};
    allExpenses.forEach((exp) => {
      if (!categoryBreakdown[exp.category]) {
        categoryBreakdown[exp.category] = 0;
      }
      categoryBreakdown[exp.category] += exp.amount;
    });

    res.json({
      expenses,
      summary: {
        totalAmount,
        totalCount: allExpenses.length,
        categoryBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
  try {
    const { name, category, amount, date, note } = req.body;

    if (!name || !amount) {
      return res.status(400).json({ message: 'Name and amount are required' });
    }

    const expense = new Expense({
      user: req.user._id,
      name: name.trim(),
      category: category || 'Other',
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      note: note || '',
    });

    const created = await expense.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense || expense.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const { name, category, amount, date, note } = req.body;
    expense.name = name || expense.name;
    expense.category = category || expense.category;
    expense.amount = amount !== undefined ? Number(amount) : expense.amount;
    expense.date = date ? new Date(date) : expense.date;
    expense.note = note !== undefined ? note : expense.note;

    const updated = await expense.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense || expense.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await Expense.deleteOne({ _id: expense._id });
    res.json({ message: 'Expense removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
