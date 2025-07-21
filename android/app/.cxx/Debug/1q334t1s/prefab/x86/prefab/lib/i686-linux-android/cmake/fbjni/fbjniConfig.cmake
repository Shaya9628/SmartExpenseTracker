if(NOT TARGET fbjni::fbjni)
add_library(fbjni::fbjni SHARED IMPORTED)
set_target_properties(fbjni::fbjni PROPERTIES
    IMPORTED_LOCATION "/Users/spxmac028/.gradle/caches/transforms-4/0f00902b6e3cd66f06aa4e2bb3714a21/transformed/jetified-fbjni-0.5.1/prefab/modules/fbjni/libs/android.x86/libfbjni.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/spxmac028/.gradle/caches/transforms-4/0f00902b6e3cd66f06aa4e2bb3714a21/transformed/jetified-fbjni-0.5.1/prefab/modules/fbjni/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

