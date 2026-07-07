import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Check, Plus, Trash2 } from 'lucide-react-native';
import { Bucket } from '../types.ts';
import { useRef, useState } from 'react';

interface BucketEditModalProps {
  visible: boolean;
  buckets: Bucket[];
  onClose: () => void;
  onToggleBucket: (id: number) => void;
  onAddBucket: (title: string) => void;
  onUpdateBucket: (id: number, title: string) => void;
  onDeleteBucket: (id: number) => void;
}

function BucketEditModal({
  visible,
  buckets,
  onClose,
  onToggleBucket,
  onAddBucket,
  onUpdateBucket,
  onDeleteBucket,
}: BucketEditModalProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const shouldScrollToEndRef = useRef(false);
  const [newBucketTitle, setNewBucketTitle] = useState('');

  const trimTitle = newBucketTitle.trim();
  const canAddBucket = trimTitle.length > 0;

  const handleSubmitBucket = () => {
    if (!canAddBucket) return;

    shouldScrollToEndRef.current = true;
    onAddBucket(trimTitle);
    setNewBucketTitle('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <View style={styles.editSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>버킷리스트 수정</Text>
              <Text style={styles.sheetSubtitle}>
                추가하고 싶은 직관 목표를 적어주세요
              </Text>
            </View>

            <Pressable style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>완료</Text>
            </Pressable>
          </View>

          <View style={styles.addInputRow}>
            <TextInput
              style={styles.addInput}
              value={newBucketTitle}
              onChangeText={setNewBucketTitle}
              placeholder={'직관 목표 입력'}
              placeholderTextColor={'#A8A8A8'}
              returnKeyType={'done'}
              onSubmitEditing={handleSubmitBucket}
            />

            <Pressable
              style={[
                styles.addSubmitButton,
                !canAddBucket && styles.addSubmitButtonDisabled,
              ]}
              onPress={handleSubmitBucket}
              disabled={!canAddBucket}
            >
              <Plus
                size={20}
                color={canAddBucket ? '#FFFFFF' : '#A8A8A8'}
                strokeWidth={2.7}
              />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.bucketScroll}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              if (!shouldScrollToEndRef.current) return;

              shouldScrollToEndRef.current = false;
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }}
          >
            {buckets.map(bucket => (
              <View key={String(bucket.id)} style={styles.editRow}>
                <Pressable
                  style={[
                    styles.editCheckBox,
                    bucket.isCompleted && styles.checkBoxCompleted,
                  ]}
                  onPress={() => onToggleBucket(bucket.id)}
                  hitSlop={8}
                >
                  {bucket.isCompleted && (
                    <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  )}
                </Pressable>

                <TextInput
                  value={bucket.title}
                  onChangeText={text => onUpdateBucket(bucket.id, text)}
                  placeholder="버킷리스트 입력"
                  placeholderTextColor="#B0B0B0"
                  style={styles.editInput}
                />

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => onDeleteBucket(bucket.id)}
                  hitSlop={8}
                >
                  <Trash2 size={17} color={'#A8A8A8'} strokeWidth={2.2} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default BucketEditModal;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  editSheet: {
    height: '78%',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 30,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 56,
    height: 4,
    marginBottom: 26,
    borderRadius: 2,
    backgroundColor: '#D8D8D8',
  },
  sheetHeader: {
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111111',
  },
  sheetSubtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#9A9A9A',
  },
  doneButton: {
    height: 40,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111111',
  },
  addInputRow: {
    height: 48,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7E7E7',
    backgroundColor: '#FAFAFA',
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  addSubmitButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSubmitButtonDisabled: {
    backgroundColor: '#E6E6E6',
  },
  addSubmitButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addSubmitButtonTextDisabled: {
    color: '#A8A8A8',
  },
  bucketScroll: { flex: 1 },

  addRow: {
    height: 56,
    marginBottom: 20,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E9E9E9',
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
  },
  addIcon: {
    width: 26,
    height: 26,
    marginRight: 12,
    borderRadius: 13,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRowText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9A9A9A',
  },
  editRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editCheckBox: {
    width: 20,
    height: 20,
    marginRight: 12,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#D6D6D6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxCompleted: {
    borderColor: '#111111',
    backgroundColor: '#111111',
  },
  editInputWrap: {
    flex: 1,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECECEC',
    backgroundColor: '#F7F7F7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    flex: 1,
    height: 42,
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  deleteButton: {
    width: 36,
    height: 36,
    marginLeft: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
