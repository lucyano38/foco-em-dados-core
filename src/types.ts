export interface DashboardData {
  headers: string[];
  columnTypes: Record<string, string>;
  totalRows: number;
  sampleData: Record<string, string | number | boolean>[];
  insight: string;
}

export interface CompareWebSource {
  title: string;
  uri: string;
}

export interface CompareWebResult {
  productName: string;
  productPrice: number | string;
  insight: string;
  sources: CompareWebSource[];
  timestamp: string;
}

export interface AdminMetrics {
  message: string;
  totalUsers: number;
  proUsersCount: number;
  currentUserEmail: string;
  currentUserRole: string;
  timestamp: string;
}
