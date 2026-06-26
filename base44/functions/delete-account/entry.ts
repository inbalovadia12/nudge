import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entities = [
      'UserProfile', 'SavingsGoal', 'Purchase', 'Bill', 'Subscription',
      'Challenge', 'Achievement', 'HealthScore', 'SpendingHabit',
      'TrackedProduct', 'RegretLog', 'GroceryMemory', 'SavedItem',
      'BlockedApp', 'BankAccount', 'BankTransaction', 'ChatMessage',
      'Conversation', 'FeatureUsage', 'CreditTransaction', 'DailyNudge',
      'PurchaseVerdict'
    ];

    const results = {};
    let totalDeleted = 0;

    for (const entityName of entities) {
      try {
        const records = await base44.entities[entityName].list();
        for (const record of records) {
          try {
            await base44.entities[entityName].delete(record.id);
            totalDeleted++;
          } catch (e) {
            console.log(`Failed to delete ${entityName} record ${record.id}: ${e.message}`);
          }
        }
        results[entityName] = records.length;
      } catch (e) {
        results[entityName] = `error: ${e.message}`;
        console.log(`Entity ${entityName} error: ${e.message}`);
      }
    }

    console.log(`Delete account for user ${user.email}: ${totalDeleted} records deleted`, results);

    return Response.json({
      success: true,
      recordsDeleted: totalDeleted,
      results
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});