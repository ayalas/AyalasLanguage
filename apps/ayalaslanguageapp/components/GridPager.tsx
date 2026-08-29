import useTextStyles from "@/lib/useTextStyles";
import { ChevronFirst, ChevronLast, CircleArrowLeft, CircleArrowRight } from "lucide-react-native";
import { TouchableOpacity, View, Text } from "react-native";

interface Props {
  hasMoreData: boolean;
  page: number;
  loadData: (pgNum: number) => Promise<void>;
  totalPages: number;
}

export function GridPager(props: Props) {
    const { hasMoreData, page, loadData, totalPages } = props;
    const { styles } = useTextStyles();

    return (totalPages > 1 && (
        <View className="form-row">
            <View className="header-links">
                <View>
                    <TouchableOpacity testID="first" disabled={page == 1} onPress={async () => await loadData(1)} className="pager-button"><ChevronFirst className="color-brand-primary" /></TouchableOpacity>
                </View>
                <View>
                    <TouchableOpacity testID="prev" disabled={page == 1} onPress={async () => await loadData(page - 1)} className="pager-button"><CircleArrowLeft className="color-brand-primary" /></TouchableOpacity>
                </View>
                <View>
                    <Text style={styles.text} testID="pagenum">{page} of {totalPages}</Text>
                </View>
                <View>
                    <TouchableOpacity testID="next" disabled={!hasMoreData} onPress={async () => await loadData(page + 1)} className="pager-button"><CircleArrowRight className="color-brand-primary" /></TouchableOpacity>
                </View>
                <View>
                    <TouchableOpacity testID="last" disabled={page == totalPages} onPress={async () => await loadData(totalPages)} className="pager-button"><ChevronLast className="color-brand-primary" /></TouchableOpacity>
                </View>
            </View>
        </View>)
    );
}