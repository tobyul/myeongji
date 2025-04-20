// theme-loader.js
(function() {
    // 테마 로딩 및 적용
    async function loadAndApplyTheme() {
        try {
            // 로컬 캐시 확인 (선택 사항)
            // const cachedTheme = sessionStorage.getItem('current_theme');
            // if (cachedTheme) {
            //     applyTheme(cachedTheme);
            // }
            
            // 서버에서 최신 테마 가져오기
            const response = await fetch('https://gw.ecron.co.kr:81/api/theme');
            if (!response.ok) throw new Error('테마 로딩 실패');
            
            const data = await response.json();
            const theme = data[0].theme || 'spring';

            console.log(theme);
            
            // 테마 적용 및 캐시 저장
            applyTheme(theme);
            sessionStorage.setItem('current_theme', theme);
            
            // 테마 선택기가 있으면 값 설정
            const themeSelect = document.getElementById('themeSelect');
            if (themeSelect) themeSelect.value = theme;
            
            return theme;
        } catch (error) {
            console.error('테마 로딩 오류:', error);
            applyTheme('spring'); // 기본 테마 적용
            return 'spring';
        }
    }
    
    // 테마 적용 함수
    function applyTheme(theme) {
        // 문서에 테마 적용
        document.documentElement.setAttribute('data-theme', theme);
        
        // AG Grid 테마 적용 (있는 경우)
        const gridDiv = document.getElementById('storeGrid');
        if (gridDiv) {
            gridDiv.className = `ag-theme-alpine${theme === 'dark' ? '-dark' : ''}`;
            
            // 그리드 API가 있는 경우 새로고침
            if (window.gridApi) {
                setTimeout(() => {
                    window.gridApi.refreshCells({ force: true });
                }, 50);
            }
        }
    }
    
    // 테마 변경 및 저장 함수 (전역으로 노출)
    window.changeTheme = async function(theme) {
        // 즉시 테마 적용
        applyTheme(theme);
        //sessionStorage.setItem('current_theme', theme);
        
        // 서버에 테마 저장
        try {
            const response = await fetch('https://gw.ecron.co.kr:81/api/theme', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ theme })
            });
            
            return response.ok;
        } catch (error) {
            console.error('테마 저장 오류:', error);
            return false;
        }
    };
    
    // 페이지 로드 완료 시 테마 적용
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAndApplyTheme);
    } else {
        loadAndApplyTheme();
    }
})();