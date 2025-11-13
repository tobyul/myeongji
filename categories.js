// categories.js - 카테고리 중앙 관리
(function() {
    'use strict';
    
    // 카테고리 정의
    window.CATEGORIES = {
        ALL: '전체',
        FOOD: '음식/카페',
        LIFE: '생활/편의',
        EDUCATION: '교육/건강',  // 여기만 수정하면 전체 적용!
        ETC: '기타'
    };
    
    // 카테고리 CSS 클래스 매핑
    window.CATEGORY_COLORS = {
        [window.CATEGORIES.FOOD]: 'category-food-cafe',
        [window.CATEGORIES.LIFE]: 'category-life-convenience',
        [window.CATEGORIES.EDUCATION]: 'category-health-beauty',
        [window.CATEGORIES.ETC]: 'category-etc'
    };
    
    // 카테고리 배지 색상 매핑
    window.CATEGORY_BADGE_COLORS = {
        [window.CATEGORIES.FOOD]: 'bg-danger',
        [window.CATEGORIES.LIFE]: 'bg-primary',
        [window.CATEGORIES.EDUCATION]: 'bg-info',
        [window.CATEGORIES.ETC]: 'bg-success'
    };
    
    // 카테고리 배열 (순서 유지)
    window.CATEGORY_LIST = [
        window.CATEGORIES.FOOD,
        window.CATEGORIES.LIFE,
        window.CATEGORIES.EDUCATION,
        window.CATEGORIES.ETC
    ];
    
    // 헬퍼 함수들
    window.getCategoryColor = function(category) {
        return window.CATEGORY_COLORS[category] || '';
    };
    
    window.getCategoryBadgeColor = function(category) {
        return window.CATEGORY_BADGE_COLORS[category] || 'bg-secondary';
    };
    
})();