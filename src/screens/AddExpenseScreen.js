import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { db } from '../db/queries';
import { addTransaction, setLoading } from '../store/slices/transactionSlice';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const validationSchema = Yup.object().shape({
  amount: Yup.number().required('Amount is required').positive('Amount must be positive'),
  description: Yup.string().required('Description is required').min(3, 'Description too short'),
});

const AddExpenseScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [categories, setCategories] = useState([]);
  const [banks, setBanks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);

  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM categories', [], (_, { rows }) => {
        const data = [];
        for (let i = 0; i < rows.length; i++) {
          data.push(rows.item(i));
        }
        setCategories(data);
      });
    });

    db.transaction(tx => {
      tx.executeSql('SELECT * FROM banks', [], (_, { rows }) => {
        const data = [];
        for (let i = 0; i < rows.length; i++) {
          data.push(rows.item(i));
        }
        setBanks(data);
      });
    });
  }, []);

  const handleSubmit = (values) => {
    if (!selectedCategory || !selectedBank) {
      Alert.alert('Missing Info', 'Please select both a category and a bank.');
      return;
    }

    const timestamp = new Date().toISOString();

    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO transactions (type, amount, date, description, category_id, bank_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'DEBIT',
          parseFloat(values.amount),
          timestamp,
          values.description,
          selectedCategory.id,
          selectedBank.id,
        ],
        (_, result) => {
          const insertId = result.insertId;
          dispatch(addTransaction({
            id: insertId,
            type: 'DEBIT',
            date: timestamp,
            amount: parseFloat(values.amount),
            description: values.description,
            category_id: selectedCategory.id,
            category_name: selectedCategory.name,
            bank_id: selectedBank.id,
            bank_name: selectedBank.name,
          }));
          navigation.goBack();
        },
        (_, error) => {
          console.error('Error inserting transaction:', error);
          Alert.alert('Database Error', 'Could not add transaction.');
        }
      );
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Formik
        initialValues={{ amount: '', description: '' }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View style={styles.form}>
            <TextInput
              label="Amount"
              keyboardType="numeric"
              value={values.amount}
              onChangeText={handleChange('amount')}
              onBlur={handleBlur('amount')}
              error={touched.amount && !!errors.amount}
              style={styles.input}
            />
            {touched.amount && errors.amount && (
              <Text style={styles.errorText}>{errors.amount}</Text>
            )}

            <TextInput
              label="Description"
              value={values.description}
              onChangeText={handleChange('description')}
              onBlur={handleBlur('description')}
              error={touched.description && !!errors.description}
              style={styles.input}
            />
            {touched.description && errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}

            <Text style={styles.sectionTitle}>Select Category</Text>
            <View style={styles.categories}>
            {categories.map((category) => (
  <View key={category.id} style={styles.categoryItem}>
    <TouchableOpacity
      style={[
        styles.categoryInner,
        selectedCategory?.id === category.id && styles.selectedCategory
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
        <MaterialCommunityIcons
          name={category.icon}
          size={20}
          color="#fff"
        />
      </View>
      <Text style={styles.categoryName}>{category.name}</Text>
    </TouchableOpacity>
  </View>
))}
            </View>

            <Text style={styles.sectionTitle}>Select Bank</Text>
            <View style={styles.bankList}>
              {banks.map((bank, index) => (
                <TouchableOpacity
                  key={bank.id}
                  style={[
                    styles.bankItem,
                    index === banks.length - 1 && styles.bankItemLast,
                    selectedBank?.id === bank.id && styles.selectedBank
                  ]}
                  onPress={() => setSelectedBank(bank)}
                >
                  <View style={styles.bankLeft}>
                    <Text style={styles.bankName}>{bank.name}</Text>
                    <Text style={styles.bankBalance}>Balance: ₹{bank.balance.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.bankRight, selectedBank?.id === bank.id && styles.bankSelected]}>
                    {selectedBank?.id === bank.id && <Text style={styles.bankCheck}>✓</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <Button mode="contained" onPress={handleSubmit} style={styles.submitButton}>
              Add Expense
            </Button>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

export default AddExpenseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 16,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    marginHorizontal: -6,
  },
  categoryItem: {
    width: '33.33%',
    padding: 6,
  },
  categoryInner: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedCategory: {
    borderColor: '#6200ee',
    backgroundColor: '#f4e8ff',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 24,
    color: '#fff',
  },
  categoryName: {
    fontSize: 13,
    textAlign: 'center',
    color: '#333',
  },
  bankList: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bankItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankItemLast: {
    borderBottomWidth: 0,
  },
  selectedBank: {
    backgroundColor: '#f4e8ff',
  },
  bankLeft: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  bankBalance: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },  
  bankRight: {
    marginLeft: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6200ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankSelected: {
    backgroundColor: '#6200ee',
  },
  bankCheck: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    marginTop: 16,
  },
});
