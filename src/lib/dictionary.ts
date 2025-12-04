export const dictionary = {
  ko: {
    nav: {
      inventory: '재고 현황',
      dashboard: '대시보드',
      alerts: '알림 센터',
      add: '입고 등록',
      import: '데이터 가져오기',
      admin: '관리자',
      start: '시작하기'
    },
    landing: {
      badge: '재고 관리 시스템 v2.0',
      title: '재고 관리,\n',
      titleSuffix: '더 심플하게.',
      description: '정확한 재고 관리의 시작. 실시간 추적, 완벽한 연동, 강력한 분석 기능을 미니멀한 인터페이스에서 경험하세요.',
      startBtn: '관리 시작하기',
      docsBtn: '문서 보기',
      features: {
        sync: '실시간 동기화',
        analytics: '고급 분석',
        team: '팀 협업',
        export: '엑셀 내보내기'
      },
      floating: {
        fast: '빠른 동기화',
        secure: '보안 연결',
        updated: '방금 업데이트됨',
        encrypted: '암호화 활성'
      },
      footer: '최신 기술 스택으로 구축됨',
      companyInfo: {
        name: '주식회사 에스알국제 (SR International Inc.)',
        address: '서울특별시 마포구 토정로 128, 4층',
        contact: '02-332-6686 / hbshin@sr-kc.com',
        copyright: '© 2025 SR International Inc. All rights reserved.'
      }
    },
    inventory: {
      title: '재고 현황',
      description: '실시간으로 재고 수량과 발주 상태를 관리하세요.',
      addItem: '항목 추가',
      exportCsv: 'CSV 내보내기',
      applyFilters: '필터 적용',
      loading: '데이터 로딩 중...',
      noData: '데이터가 없습니다',
      columns: {
        company: '업체명',
        model: '차종',
        partNo: '품번',
        partName: '품명',
        inbound: '입고',
        stock: '재고',
        shortage: '미/과입고',
        order: '월발주',
        outbound: '반출',
        note: '비고',
        action: '작업'
      },
      placeholders: {
        company: '업체명 검색',
        model: '차종 검색',
        partNo: '품번 검색'
      },
      pagination: {
        show: '보기',
        previous: '이전',
        next: '다음',
        page: '페이지'
      },
      modals: {
        inboundTitle: '입고 등록',
        editTitle: '항목 수정',
        cancel: '취소',
        save: '저장하기',
        saving: '처리 중...',
        delete: '삭제하기',
        supplier: '업체명',
        model: '차종',
        partNo: '품번',
        partName: '품명',
        inDate: '입고일자',
        inQty: '입고수량',
        orderQty: '발주수량',
        notes: '비고',
        stockInfo: '재고 정보'
      }
    },
    dashboard: {
      title: '대시보드 개요',
      description: '주요 지표 및 성과 현황',
      totalItems: '총 품목 수',
      totalStock: '총 재고량',
      lowStock: '부족 재고',
      outOfStock: '재고 없음',
      subValues: {
        activeSku: '활성 품목',
        onHand: '보유 수량',
        reorder: '재발주 필요',
        critical: '긴급'
      },
      monthlyFlow: '월별 흐름',
      categoryDist: '카테고리 분포',
      incoming: '입고',
      outgoing: '반출'
    },
    add: {
      back: '재고 현황으로 돌아가기',
      title: '새 항목 입고',
      description: '새로운 재고 항목을 등록하거나 기존 재고를 업데이트합니다.',
      itemDetails: '항목 상세',
      stockInfo: '재고 정보',
      supplier: '업체명',
      model: '차종',
      partNo: '품번',
      partName: '품명',
      inDate: '입고일자',
      inQty: '입고수량',
      orderQty: '발주수량',
      notes: '비고',
      cancel: '취소',
      save: '항목 등록',
      saving: '저장 중...'
    },
    import: {
      back: '재고 현황으로 돌아가기',
      title: '데이터 가져오기',
      description: 'Excel 파일을 사용하여 재고 데이터를 일괄 업로드합니다.',
      downloadTemplate: '템플릿 다운로드',
      clickUpload: '클릭하여 업로드',
      dragDrop: '또는 파일을 드래그하세요',
      fileType: 'XLSX 또는 XLS 파일만 가능',
      preview: '파일 미리보기 (첫 5행)',
      startImport: '가져오기 시작',
      uploading: '업로드 중...',
      complete: '가져오기 완료',
      successMsg: '성공적으로 {count}개 항목을 가져왔습니다.',
      failMsg: '{count}개 항목 가져오기 실패.',
      errorTitle: '오류 목록'
    },
    alerts: {
      back: '재고 현황으로 돌아가기',
      title: '알림 센터',
      description: '재고 알림 및 시스템 공지 사항을 관리합니다.',
      dismissSelected: '선택 삭제',
      refresh: '새로고침',
      loading: '알림 로딩 중...',
      allGood: '모두 정상입니다!',
      noAlerts: '현재 대기 중인 알림이 없습니다.',
      types: {
        outOfStock: '재고 없음',
        lowStock: '부족 재고',
        highDemand: '높은 수요',
        stockUpdated: '재고 정보 수정'
      },
      priority: {
        high: '긴급',
        medium: '주의',
        low: '알림'
      }
    },
    admin: {
      back: '재고 현황으로 돌아가기',
      title: '관리자 설정',
      description: '마스터 데이터 및 시스템 환경설정을 관리합니다.',
      tabs: {
        master: '마스터 데이터',
        settings: '환경설정'
      },
      addTitle: '새 항목 추가',
      addBtn: '추가',
      columns: {
        supplier: '업체명',
        model: '차종',
        partNo: '품번',
        partName: '품명',
        action: '작업'
      },
      settings: {
        userPref: '사용자 환경설정',
        displayName: '표시 이름',
        displayNameDesc: '이 이름은 수정 이력 로그에 표시됩니다.',
        save: '변경사항 저장',
        saved: '저장됨'
      }
    },
    common: {
      save: '저장',
      cancel: '취소',
      delete: '삭제',
      edit: '수정',
      confirm: '확인',
      success: '성공',
      error: '오류'
    }
  },
  en: {
    nav: {
      inventory: 'Inventory',
      dashboard: 'Dashboard',
      alerts: 'Alerts',
      add: 'Add Item',
      import: 'Import',
      admin: 'Admin',
      start: 'Start Managing'
    },
    landing: {
      badge: 'Inventory System v2.0',
      title: 'Inventory\n',
      titleSuffix: 'Simplified.',
      description: 'Manage stock with precision. Real-time tracking, seamless integration, and powerful analytics in one minimal interface.',
      startBtn: 'Start Managing',
      docsBtn: 'Documentation',
      features: {
        sync: 'Real-time Sync',
        analytics: 'Advanced Analytics',
        team: 'Team Collaboration',
        export: 'Export to Excel'
      },
      floating: {
        fast: 'Fast Sync',
        secure: 'Secure',
        updated: 'Updated just now',
        encrypted: 'Encryption Active'
      },
      footer: 'Built with modern stack',
      companyInfo: {
        name: 'SR International Inc.',
        address: '4F, 128, Tojeong-ro, Mapo-gu, Seoul, Republic of Korea',
        contact: '02-332-6686 / hbshin@sr-kc.com',
        copyright: '© 2025 SR International Inc. All rights reserved.'
      }
    },
    inventory: {
      title: 'Inventory Status',
      description: 'Manage your stock levels and orders in real-time.',
      addItem: 'Add Item',
      exportCsv: 'Export CSV',
      applyFilters: 'Apply Filters',
      loading: 'Loading data...',
      noData: 'No data found',
      columns: {
        company: 'Company',
        model: 'Model',
        partNo: 'Part No',
        partName: 'Part Name',
        inbound: 'Inbound',
        stock: 'Stock',
        shortage: 'Shortage',
        order: 'Order',
        outbound: 'Outbound',
        note: 'Note',
        action: 'Action'
      },
      placeholders: {
        company: 'Search Company',
        model: 'Search Model',
        partNo: 'Search Part No'
      },
      pagination: {
        show: 'Show',
        previous: 'Previous',
        next: 'Next',
        page: 'Page'
      },
      modals: {
        inboundTitle: 'New Inbound',
        editTitle: 'Edit Item',
        cancel: 'Cancel',
        save: 'Save Changes',
        saving: 'Saving...',
        delete: 'Delete',
        supplier: 'Supplier',
        model: 'Model',
        partNo: 'Part No',
        partName: 'Part Name',
        inDate: 'Inbound Date',
        inQty: 'Inbound Qty',
        orderQty: 'Order Qty',
        notes: 'Notes',
        stockInfo: 'Stock Information'
      }
    },
    dashboard: {
      title: 'Dashboard Overview',
      description: 'Key metrics and performance indicators',
      totalItems: 'Total Items',
      totalStock: 'Total Stock',
      lowStock: 'Low Stock',
      outOfStock: 'Out of Stock',
      subValues: {
        activeSku: 'Active SKUs',
        onHand: 'Units on hand',
        reorder: 'Need reordering',
        critical: 'Critical'
      },
      monthlyFlow: 'Monthly Flow',
      categoryDist: 'Category Distribution',
      incoming: 'Incoming',
      outgoing: 'Outgoing'
    },
    add: {
      back: 'Back to Inventory',
      title: 'New Inbound Item',
      description: 'Register new stock items or update existing inventory counts.',
      itemDetails: 'Item Details',
      stockInfo: 'Stock Information',
      supplier: 'Supplier',
      model: 'Model',
      partNo: 'Part Number',
      partName: 'Part Name',
      inDate: 'Inbound Date',
      inQty: 'Inbound Quantity',
      orderQty: 'Order Quantity',
      notes: 'Notes',
      cancel: 'Cancel',
      save: 'Register Item',
      saving: 'Saving...'
    },
    import: {
      back: 'Back to Inventory',
      title: 'Import Data',
      description: 'Bulk upload inventory data using Excel files.',
      downloadTemplate: 'Download Template',
      clickUpload: 'Click to upload',
      dragDrop: 'or drag and drop',
      fileType: 'XLSX or XLS files only',
      preview: 'File Preview (First 5 rows)',
      startImport: 'Start Import',
      uploading: 'Uploading...',
      complete: 'Import Complete',
      successMsg: 'Successfully imported {count} items.',
      failMsg: 'Failed to import {count} items.',
      errorTitle: 'Error List'
    },
    alerts: {
      back: 'Back to Inventory',
      title: 'Alerts & Notifications',
      description: 'Manage stock alerts and system notifications.',
      dismissSelected: 'Dismiss Selected',
      refresh: 'Refresh',
      loading: 'Loading alerts...',
      allGood: 'All Good!',
      noAlerts: 'No pending alerts at the moment.',
      types: {
        outOfStock: 'Out of Stock',
        lowStock: 'Low Stock',
        highDemand: 'High Demand',
        stockUpdated: 'Stock Updated'
      },
      priority: {
        high: 'High',
        medium: 'Medium',
        low: 'Low'
      }
    },
    admin: {
      back: 'Back to Inventory',
      title: 'Admin Settings',
      description: 'Manage master data and system preferences.',
      tabs: {
        master: 'Master Data',
        settings: 'Preferences'
      },
      addTitle: 'Add New Item',
      addBtn: 'Add',
      columns: {
        supplier: 'Supplier',
        model: 'Model',
        partNo: 'Part No',
        partName: 'Part Name',
        action: 'Action'
      },
      settings: {
        userPref: 'User Preferences',
        displayName: 'Display Name',
        displayNameDesc: 'This name will appear in edit history logs.',
        save: 'Save Changes',
        saved: 'Saved'
      }
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      confirm: 'Confirm',
      success: 'Success',
      error: 'Error'
    }
  }
}

export type Language = 'ko' | 'en'
export type Dictionary = typeof dictionary.en
