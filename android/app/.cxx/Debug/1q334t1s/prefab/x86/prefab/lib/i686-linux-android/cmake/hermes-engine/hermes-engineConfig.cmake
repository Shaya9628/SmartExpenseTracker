if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/spxmac028/.gradle/caches/transforms-4/e2fb2b9e62ad988a03ec73894a846666/transformed/jetified-hermes-android-0.73.2-debug/prefab/modules/libhermes/libs/android.x86/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/spxmac028/.gradle/caches/transforms-4/e2fb2b9e62ad988a03ec73894a846666/transformed/jetified-hermes-android-0.73.2-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

