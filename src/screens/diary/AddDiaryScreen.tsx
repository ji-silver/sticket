import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/core';
import DiaryCover from '../../components/DiaryCover.tsx';
import { useState } from 'react';

type SportId = 'baseball' | 'soccer' | 'basketball' | 'volleyball';

interface SportOption {
  id: SportId;
  label: string;
  isReady: boolean;
}

type CoverColorType = 'solid' | 'stripe';

interface CoverColorOption {
  id: string;
  color: string;
  type: CoverColorType;
}

const SPORTS: SportOption[] = [
  {
    id: 'baseball',
    label: '야구',
    isReady: true,
  },
  {
    id: 'soccer',
    label: '축구',
    isReady: false,
  },
  {
    id: 'basketball',
    label: '농구',
    isReady: false,
  },
  {
    id: 'volleyball',
    label: '배구',
    isReady: false,
  },
];

const COVER_COLORS: CoverColorOption[] = [
  {
    id: 'kiwoom-wine',
    type: 'solid',
    color: '#DF9EAF',
  },
  {
    id: 'white-black-stripe',
    type: 'stripe',
    color: '#F8F8F8',
  },
  {
    id: 'giants-orange',
    type: 'solid',
    color: '#F4A06E',
  },
  {
    id: 'lions-blue',
    type: 'solid',
    color: '#8DB7E4',
  },
  {
    id: 'dinos-blue',
    type: 'solid',
    color: '#9EB2D0',
  },
  {
    id: 'soft-black',
    type: 'solid',
    color: '#9B9B9B',
  },
  {
    id: 'navy',
    type: 'solid',
    color: '#96A8C2',
  },
  {
    id: 'tigers-red',
    type: 'solid',
    color: '#EC8F9F',
  },
  {
    id: 'eagles-navy',
    type: 'solid',
    color: '#9D9AC4',
  },
  {
    id: 'twins-burgundy',
    type: 'solid',
    color: '#BE8D9D',
  },
];

function AddDiaryScreen() {
  const navigation = useNavigation();

  const [selectedSportId, setSelectedSportId] = useState<SportId>('baseball');
  const [selectedCoverColorId, setSelectedCoverColorId] = useState(
    COVER_COLORS[0].id,
  );

  const selectSport = SPORTS.find(sport => sport.id === selectedSportId);
  const isSelectedSportReady = selectSport?.isReady ?? false;
  const selectedCoverColor =
    COVER_COLORS.find(color => color.id === selectedCoverColorId) ??
    COVER_COLORS[0];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={26} color={'#111111'} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.headerTitle}>새 티켓북</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.previewSection}>
          <DiaryCover
            size={178}
            coverColor={selectedCoverColor.color}
            coverPattern={selectedCoverColor.type}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>스포츠</Text>
          <View style={styles.sportList}>
            {SPORTS.map(sport => {
              const isSelected = selectedSportId === sport.id;

              return (
                <Pressable
                  key={sport.id}
                  style={[
                    styles.sportChip,
                    isSelected && styles.sportChipSelected,
                  ]}
                  onPress={() => setSelectedSportId(sport.id)}
                >
                  <Text
                    style={[
                      styles.sportChipText,
                      isSelected && styles.sportChipTextSelected,
                    ]}
                  >
                    {sport.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {isSelectedSportReady ? (
          <>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>표지 색상</Text>

              <View style={styles.colorGrid}>
                {COVER_COLORS.map(colorOption => {
                  const isSelected = selectedCoverColorId === colorOption.id;

                  return (
                    <Pressable
                      key={colorOption.id}
                      style={[
                        styles.colorSwatchButton,
                        isSelected && styles.colorSwatchButtonSelected,
                      ]}
                      onPress={() => setSelectedCoverColorId(colorOption.id)}
                      hitSlop={8}
                    >
                      <View
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: colorOption.color },
                        ]}
                      >
                        {colorOption.type === 'stripe' && (
                          <>
                            {[3, 8, 13, 18, 23, 28].map(left => (
                              <View
                                key={`stripe-${left}`}
                                style={[styles.stripeLine, { left }]}
                              />
                            ))}
                          </>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>포토카드</Text>

              <View style={styles.photoCardRow}>
                <Text style={styles.photoCardText}>이미지 추가</Text>
                <Text style={styles.photoCardOptionalText}>선택사항</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.readySoonBox}>
            <Text style={styles.readySoonTitle}>
              {selectSport?.label} 티켓북은 준비중이에요
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.createButton,
            !isSelectedSportReady && styles.createButtonDisabled,
          ]}
          disabled={!isSelectedSportReady}
        >
          <Text
            style={[
              styles.createButtonText,
              !isSelectedSportReady && styles.createButtonTextDisabled,
            ]}
          >
            티켓북 만들기
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default AddDiaryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 60,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 32,
    height: 32,
    marginLeft: -8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111111',
  },
  scrollContent: {
    paddingBottom: 24,
  },

  previewSection: {
    paddingTop: 20,
    alignItems: 'center',
  },

  formSection: {
    marginTop: 28,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#111111',
  },
  sportList: {
    flexDirection: 'row',
    gap: 8,
  },
  sportChip: {
    minWidth: 72,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E7E7E7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportChipSelected: {
    borderColor: '#111111',
    backgroundColor: '#111111',
  },

  sportChipText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#777777',
  },
  sportChipTextSelected: {
    color: '#FFFFFF',
  },

  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 16,
  },
  colorSwatchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E7E7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchButtonSelected: {
    borderWidth: 2,
    borderColor: '#111111',
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stripeLine: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: 30,
    backgroundColor: '#000000',
  },

  photoCardRow: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E7E7',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoCardText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222222',
  },
  photoCardOptionalText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A0A0A0',
  },
  readySoonBox: {
    marginTop: 28,
    marginHorizontal: 24,
    minHeight: 124,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  readySoonTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#777777',
    textAlign: 'center',
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
    backgroundColor: '#FFFFFF',
  },
  createButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#E8E8E8',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  createButtonTextDisabled: {
    color: '#AAAAAA',
  },
});
