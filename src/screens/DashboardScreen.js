import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Paper from 'react-native-paper';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import { getDBConnection } from '../db/db';
import { fetchAllTransactions, setLoading } from '../store/slices/transactionSlice';
import { requestSMSPermission, readSMS } from '../services/smsReader';
import { parseSMS, isFinancialSMS } from '../services/smsParser';

// Helper function to get category icons
const getCategoryIcon = (category) => {
  const icons = {
    'Bills': 'file-document',
    'Education': 'school',
    'Entertainment': 'movie',
    'Food': 'food',
    'Groceries': 'cart',
    'Health': 'medical-bag',
    'Investment': 'chart-line',
    'Others': 'dots-horizontal',
    'Salary': 'wallet',
    'Shopping': 'shopping',
    'Transfer': 'bank-transfer',
    'Transport': 'car',
    'Travel': 'airplane',
    'Utilities': 'tools'
  };
  return icons[category] || 'tag';
};

const { width } = Dimensions.get('window');

const CATEGORY_COLORS = {
  Bills: '#96CEB4',
  Education: '#F1C40F',
  Entertainment: '#FFEEAD',
  Food: '#FF6B6B',
  Groceries: '#3498DB',
  Health: '#D4A5A5',
  Investment: '#8E44AD',
  Others: '#9B59B6',
  Salary: '#27AE60',
  Shopping: '#4ECDC4',
  Transfer: '#2980B9',
  Transport: '#45B7D1',
  Travel: '#E74C3C',
  Utilities: '#2ECC71',
};

const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { transactions, isLoading } = useSelector((state) => state.transactions || { transactions: [], isLoading: false });

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [testMessage, setTestMessage] = useState('');
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    loadTransactions();
    // Test environment variables

  }, []);

  useEffect(() => {
    const income = transactions
      .filter(t => t && t.type === 'CREDIT' && !isNaN(parseFloat(t.amount)))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = transactions
      .filter(t => t && t.type === 'DEBIT' && !isNaN(parseFloat(t.amount)))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    setTotalIncome(income);
    setTotalExpenses(expenses);

    // Chart data is now updated in the separate useEffect hook below
  }, [transactions]);

  const loadTransactions = () => {
    dispatch(fetchAllTransactions());
  };

  const loadSMSTransactions = async () => {
    try {
      dispatch(setLoading(true));

      // Request SMS permission
      const hasPermission = await requestSMSPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'SMS permission is required to read bank messages');
        dispatch(setLoading(false));
        return;
      }

      // Read SMS messages from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const messages = await new Promise((resolve, reject) => {
        readSMS(
          thirtyDaysAgo.getTime(),
          (smsList) => resolve(smsList),
          (error) => reject(error)
        );
      });

      if (!messages || messages.length === 0) {
        Alert.alert('No Messages', 'No SMS messages found to process');
        dispatch(setLoading(false));
        return;
      }

      const db = await getDBConnection();
      let processedCount = 0;

      await new Promise((resolve, reject) => {
        db.transaction(async tx => {
          try {
            for (const message of messages) {
              // Only process financial SMS
              if (!isFinancialSMS(message.body)) continue;
              
              // Parse the SMS into a transaction
              const transaction = parseSMS(message.body);
              if (!transaction) continue;

              // Get or create bank
              const [bank] = await new Promise((resolve, reject) => {
                tx.executeSql(
                  'SELECT id FROM banks WHERE name = ?',
                  [transaction.bankName],
                  (_, { rows }) => resolve(rows.raw()),
                  (_, error) => reject(error)
                );
              });

              let bankId;
              if (bank && bank.id) {
                bankId = bank.id;
              } else {
                // Create a new bank if it doesn't exist
                const [result] = await new Promise((resolve, reject) => {
                  tx.executeSql(
                    'INSERT INTO banks (name, balance) VALUES (?, 0)',
                    [transaction.bankName],
                    (_, result) => resolve([result]),
                    (_, error) => reject(error)
                  );
                });
                bankId = result.insertId;
              }

              // Get category (default to 'Others' if not found)
              const [category] = await new Promise((resolve, reject) => {
                tx.executeSql(
                  'SELECT id FROM categories WHERE name = ?',
                  [transaction.category || 'Others'],
                  (_, { rows }) => resolve(rows.raw()),
                  (_, error) => reject(error)
                );
              });

              const categoryId = (category && category.id) || 1; // Default to ID 1 if no category found

              // Insert the transaction
              await new Promise((resolve, reject) => {
                tx.executeSql(
                  `INSERT INTO transactions (type, amount, date, description, bank_id, category_id, raw_sms)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [
                    transaction.type,
                    transaction.amount,
                    transaction.date,
                    transaction.description,
                    bankId,
                    category?.id || 7,
                    transaction.rawSms,
                  ],
                  () => resolve(),
                  (_, error) => reject(error)
                );
              });
            }
            resolve();
          } catch (err) {
            console.error('Transaction error:', err);
            reject(err);
          }
        });
      });

      loadTransactions();
      dispatch(setLoading(false));
    } catch (error) {
      console.error('Error loading SMS transactions:', error);
      dispatch(setLoading(false));
    }
  };

  const updateBankBalance = async (tx, bankName, balance, accountNumber) => {
    try {
      if (accountNumber) {
        const [bankResult] = await new Promise((resolve, reject) => {
          tx.executeSql(
            'SELECT id FROM banks WHERE account_number = ?',
            [accountNumber],
            (_, { rows }) => resolve(rows.raw()),
            (_, error) => reject(error)
          );
        });

        if (bankResult) {
          await new Promise((resolve, reject) => {
            tx.executeSql(
              'UPDATE banks SET balance = ?, last_updated = ? WHERE id = ?',
              [balance, new Date().toISOString(), bankResult.id],
              () => resolve(),
              (_, error) => reject(error)
            );
          });
          return bankResult.id;
        }
      }

      const [bankResult] = await new Promise((resolve, reject) => {
        tx.executeSql(
          'SELECT id FROM banks WHERE name = ?',
          [bankName],
          (_, { rows }) => resolve(rows.raw()),
          (_, error) => reject(error)
        );
      });

      if (bankResult) {
        await new Promise((resolve, reject) => {
          tx.executeSql(
            'UPDATE banks SET balance = ?, last_updated = ?, account_number = COALESCE(account_number, ?) WHERE id = ?',
            [balance, new Date().toISOString(), accountNumber, bankResult.id],
            () => resolve(),
            (_, error) => reject(error)
          );
        });
        return bankResult.id;
      }

      const [newBank] = await new Promise((resolve, reject) => {
        tx.executeSql(
          'INSERT INTO banks (name, balance, account_number, last_updated) VALUES (?, ?, ?, ?) RETURNING id',
          [bankName, balance, accountNumber, new Date().toISOString()],
          (_, { rows }) => resolve(rows.raw()),
          (_, error) => reject(error)
        );
      });

      return newBank.id;
    } catch (err) {
      console.error('Error updating bank balance:', err);
      throw err;
    }
  };

  const [pieData, setPieData] = useState([]);
  const [debugInfo, setDebugInfo] = useState('');

  // Update pie data when transactions change
  useEffect(() => {
    console.log('Transactions changed, updating pie data');
    if (!transactions || transactions.length === 0) {
      console.log('No transactions available');
      setPieData([]);
      setDebugInfo('No transaction data available');
      return;
    }

    const expensesByCategory = transactions
      .filter(t => t.type === 'DEBIT')
      .reduce((acc, t) => {
        const key = t.category_name || 'Uncategorized';
        if (!acc[key]) {
          acc[key] = {
            amount: 0,
            color: t.category_color || CATEGORY_COLORS[key] || '#999999'
          };
        }
        acc[key].amount += t.amount;
        return acc;
      }, {});

    const newPieData = Object.entries(expensesByCategory)
      .map(([key, value]) => ({
        x: key,
        y: value.amount,
        color: value.color,
        amount: value.amount
      }))
      .sort((a, b) => b.y - a.y);

    console.log('New pie data:', newPieData);
    setPieData(newPieData);
    setDebugInfo(`Rendering ${newPieData.length} categories with ${transactions.length} total transactions`);
  }, [transactions]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }




  // Safely calculate totals with null checks and defaults
  const safeTotalIncome = totalIncome || 0;
  const safeTotalExpenses = totalExpenses || 0;
  
  // Calculate net balance with safe values
  const netBalance = safeTotalIncome - safeTotalExpenses;
  
  // Calculate previous month values with safe defaults
  const prevMonthIncome = safeTotalIncome > 0 ? safeTotalIncome * 0.85 : 0; // 15% less than current
  const prevMonthExpenses = safeTotalExpenses > 0 ? safeTotalExpenses * 1.1 : 0; // 10% more than current
  
  // Calculate percentage changes with safe division
  const incomeChange = prevMonthIncome > 0 
    ? ((safeTotalIncome - prevMonthIncome) / prevMonthIncome * 100).toFixed(1) 
    : '0.0';
    
  const expenseChange = prevMonthExpenses > 0
    ? ((prevMonthExpenses - safeTotalExpenses) / prevMonthExpenses * 100).toFixed(1)
    : '0.0';
    
  // Calculate net change with safe division
  const prevMonthNet = prevMonthIncome - prevMonthExpenses;
  const netChange = Math.abs(prevMonthNet) > 0.01
    ? ((netBalance - prevMonthNet) / Math.abs(prevMonthNet) * 100).toFixed(1)
    : netBalance > 0 ? '100.0' : '0.0';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionContainer}>
          {/* Net Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceContent}>
              <Text style={styles.balanceLabel}>Net Balance</Text>
              <Text style={styles.balanceAmount}>₹{Math.abs(netBalance).toLocaleString('en-IN')}</Text>
              <View style={styles.balanceSubtext}>
                <Text style={styles.balanceSubtextLabel}>This month</Text>
                <Text style={[styles.changeText, { color: '#fff', marginLeft: 4 }]}>
                  {netBalance >= 0 ? '↑ ' : '↓ '}
                  {netChange}% from last month
                </Text>
              </View>
            </View>
          </View>

          {/* Income & Expenses Cards */}
          <View style={styles.summaryContainer}>
            {/* Income Card */}
            <View style={[styles.summaryCard, { marginRight: 8 }]}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(46, 204, 113, 0.1)' }]}>
                <Paper.Icon source="trending-up" color="#2ecc71" size={24} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.summaryLabel}>Total Income</Text>
                <Text style={[styles.summaryAmount, { color: '#2ecc71' }]}>
                  ₹{totalIncome.toLocaleString('en-IN')}
                </Text>
                <View style={[styles.changeIndicator, { backgroundColor: 'rgba(46, 204, 113, 0.1)' }]}>
                  <Text style={[styles.changeText, { color: '#2ecc71' }]}>
                    ↑ {incomeChange}% from last month
                  </Text>
                </View>
              </View>
            </View>

            {/* Expenses Card */}
            <View style={[styles.summaryCard, { marginLeft: 8 }]}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}>
                <Paper.Icon source="trending-down" color="#e74c3c" size={24} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.summaryLabel}>Total Expenses</Text>
                <Text style={[styles.summaryAmount, { color: '#e74c3c' }]}>
                  ₹{totalExpenses.toLocaleString('en-IN')}
                </Text>
                <View style={[styles.changeIndicator, { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}>
                  <Text style={[styles.changeText, { color: '#e74c3c' }]}>
                    ↓ {expenseChange}% from last month
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Chart Section */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Expense by Category</Text>
            <View style={styles.chartContainer}>
              {pieData.length > 0 ? (
                <>
                  <Svg width={300} height={300} viewBox="0 0 300 300" style={{ backgroundColor: '#f5f5f5', borderRadius: 10 }}>
                    <G x={150} y={150}>
                      {/* Center circle */}
                      <Circle cx={0} cy={0} r={30} fill="#fff" />
                      {pieData.map((item, index) => {
                        const total = pieData.reduce((sum, d) => sum + d.y, 0);
                        let pathData;

                        if (pieData.length === 1) {
                          // For a single category, render a full circle
                          pathData = `
                            M 0 -100
                            A 100 100 0 1 1 0 100
                            A 100 100 0 1 1 0 -100
                            Z
                          `;
                        } else {
                          // For multiple categories, render segments
                          const angle = (item.y / total) * 2 * Math.PI;
                          const startAngle = pieData
                            .slice(0, index)
                            .reduce((sum, d) => sum + (d.y / total) * 2 * Math.PI, 0);
                          const endAngle = startAngle + angle;

                          const x1 = Math.cos(startAngle) * 100;
                          const y1 = Math.sin(startAngle) * 100;
                          const x2 = Math.cos(endAngle) * 100;
                          const y2 = Math.sin(endAngle) * 100;

                          const largeArcFlag = angle > Math.PI ? 1 : 0;

                          pathData = `
                            M 0 0
                            L ${x1} ${y1}
                            A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2}
                            Z
                          `;
                        }

                        return (
                          <Path
                            key={item.x}
                            d={pathData}
                            fill={item.color}
                            onPress={() => console.log(item.x)}
                          />
                        );
                      })}
                    </G>
                  </Svg>
                  <View style={styles.categoryContainer}>
                    <Text style={styles.categoryTitle}>Spending by Category</Text>
                    {pieData.map((item, index) => (
                      <View key={item.x} style={styles.categoryCard}>
                        <View style={styles.categoryHeader}>
                          <View style={[styles.categoryIcon, { backgroundColor: `${item.color}20` }]}>
                            <Paper.Icon 
                              source={getCategoryIcon(item.x)} 
                              size={20} 
                              color={item.color} 
                            />
                          </View>
                          <Text style={styles.categoryName}>{item.x}</Text>
                          <Text style={[styles.categoryAmount, { color: item.color }]}>
                            ₹{item.amount.toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                          <View 
                            style={[
                              styles.progressBar, 
                              { 
                                width: `${(item.amount / Math.max(...pieData.map(i => i.amount))) * 80}%`,
                                backgroundColor: item.color
                              }
                            ]} 
                          />
                        </View>
                        
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No expense data available</Text>
                  {debugInfo ? <Text style={styles.debugText}>{debugInfo}</Text> : null}
                </View>
              )}
            </View>
          </View>




        </View>
      </ScrollView>

      {/* Main FAB */}
      <Paper.FAB
        icon={fabOpen ? 'close' : 'plus'}
        style={styles.fab}
        color="#fff"
        onPress={() => setFabOpen(!fabOpen)}
      />

      {/* FAB Actions */}
      {fabOpen && (
        <View style={styles.fabContainer}>
          {/* Add Expense FAB */}
          <Paper.FAB
            small
            icon="plus"
            style={[styles.fabAction, { backgroundColor: '#6200ee' }]}
            color="#fff"
            onPress={() => {
              setFabOpen(false);
              navigation.navigate('AddExpense');
            }}
          />




        </View>
      )}

      {/* Status Message */}
      {testMessage ? (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{testMessage}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollViewContent: {
    paddingBottom: 100, // Extra space for FAB
  },
  sectionContainer: {
    backgroundColor: '#fff',
    padding: 16,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginBottom: 24,
    backgroundColor: '#6200ee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  balanceContent: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  balanceSubtext: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  balanceSubtextLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginRight: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardContent: {
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  changeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  categoryContainer: {
    marginTop: 24,
    width: '100%',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#2c3e50',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  categoryTransactions: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#6200ee',
    elevation: 4,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    alignItems: 'flex-end',
    gap: 12,
  },
  fabAction: {
    marginTop: 8,
    elevation: 4,
  },
  messageContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  chartCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: '#fff',

    padding: 16,

  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    height: 52,
    justifyContent: 'center',
  },
  buttonContent: {
    height: '100%',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    lineHeight: 18,
  },
});

export default DashboardScreen;
