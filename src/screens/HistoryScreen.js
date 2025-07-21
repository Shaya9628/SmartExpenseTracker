import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Searchbar, Chip, IconButton, Text, useTheme } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllTransactions } from '../store/slices/transactionSlice';
import { db } from '../db/queries';

const HistoryScreen = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { transactions = [] } = useSelector((state) => state.transactions || {});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = () => {
    dispatch(fetchAllTransactions())
      .unwrap()
      .catch(error => {
        console.error('Error loading transactions:', error);
        // Optionally show an error message to the user
      });
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'ALL' || t.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleDelete = (id) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM transactions WHERE id = ?',
        [id],
        (_, result) => {
          if (result.rowsAffected > 0) {
            loadTransactions(); // This will refresh the transactions from the database
          }
        },
        (_, error) => {
          console.error('Error deleting transaction:', error);
          // Optionally show an error message to the user
          return false; // Return false to trigger the transaction's error callback
        }
      );
    });
  };

  const renderRightActions = (id) => (
    <View style={styles.rightActions}>
      <IconButton
        icon="trash-can"
        size={20}
        iconColor={theme.colors.error}
        onPress={() => handleDelete(id)}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search transactions"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filters}>
          <Chip
            selected={selectedType === 'ALL'}
            onPress={() => setSelectedType('ALL')}
            style={styles.chip}
            selectedColor={theme.colors.primary}
          >
            All
          </Chip>
          <Chip
            selected={selectedType === 'DEBIT'}
            onPress={() => setSelectedType('DEBIT')}
            style={styles.chip}
            selectedColor={theme.colors.error}
          >
            Expenses
          </Chip>
          <Chip
            selected={selectedType === 'CREDIT'}
            onPress={() => setSelectedType('CREDIT')}
            style={styles.chip}
            selectedColor={theme.colors.primary}
          >
            Income
          </Chip>
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Swipeable renderRightActions={() => renderRightActions(item.id)}>
            <List.Item
              title={item.description || `${item.type} Transaction`}
              description={`${item.bank_name || 'Unknown Bank'} • ${new Date(item.date).toLocaleDateString()}`}
              left={props => (
                <List.Icon
                  {...props}
                  icon={item.type === 'CREDIT' ? 'arrow-down-circle' : 'arrow-up-circle'}
                  color={item.type === 'CREDIT' ? theme.colors.primary : theme.colors.error}
                />
              )}
              right={props => (
                <View {...props} style={styles.amountContainer}>
                  <Text
                    style={[styles.amount, { color: item.type === 'CREDIT' ? theme.colors.primary : theme.colors.error }]}
                  >
                    {item.type === 'CREDIT' ? '+' : '-'} ₹{item.amount.toLocaleString()}
                  </Text>
                  {item.category_name && (
                    <Chip
                      style={[styles.categoryChip, { backgroundColor: item.category_color || theme.colors.surfaceVariant }]}
                      textStyle={{ color: theme.colors.onSurface }}
                      compact
                    >
                      {item.category_name}
                    </Chip>
                  )}
                </View>
              )}
              style={styles.listItem}
            />
          </Swipeable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="titleMedium">No transactions found</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.placeholder }}>
              Add some transactions to see them here
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 16,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryChip: {
    marginTop: 4,
  },
  listItem: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 4,
  },
  searchbar: {
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 16,
    alignSelf: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  }
});

export default HistoryScreen;
  